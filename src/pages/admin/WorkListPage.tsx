import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkStatusBadge from '../../components/WorkStatusBadge';
import WorkAddModal from '../../components/WorkAddModal';
import { WorkItem } from '../../types/admin';
import { Download, Printer, Trash2 } from 'lucide-react';
import { exportWorkListCSV } from '../../utils/csvExport';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { WorkStatus } from '../../constants/workStatus';

// Supabaseのworks型を拡張してWorkItem型に対応
type WorkWithWorker = Database['public']['Tables']['works']['Row'] & {
  workers?: {
    name: string | null;
  } | null;
};

const WorkListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状態管理
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [freewordQuery, setFreewordQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workers, setWorkers] = useState<Array<{ id: number; name: string }>>([]);

  // モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const checkAuthentication = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/admin/login');
        return;
      }
      // 認証確認後、データを取得
      fetchWorks();
      fetchWorkers();
    } catch (err) {
      console.error('認証チェックエラー:', err);
      navigate('/admin/login');
    }
  }, [navigate]);

  // 認証チェックとデータ取得
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          workers (
            name
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        // JWT期限切れまたは認証エラーの詳細チェック
        if (error.message.includes('JWT') || 
            error.message.includes('unauthorized') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.code === 'PGRST301') {
          console.log('JWT期限切れまたは認証エラーを検知:', error.message);
          navigate('/admin/login');
          return;
        }
        throw error;
      }

      // Supabaseのデータ構造をWorkItem型に変換
      const convertedItems: WorkItem[] = (data as WorkWithWorker[]).map((work) => ({
        id: `#${work.id}`,
        name: work.work_title || '未設定',
        status: getStatusFromNumber(work.status),
        assignee: work.workers?.name || null,
        quantity: work.quantity || undefined,
        unitPrice: work.unit_price || undefined,
        totalCost: (work.quantity && work.unit_price) ? work.quantity * work.unit_price : undefined,
        deliveryDate: work.delivery_date ? formatDate(work.delivery_date) : undefined,
      }));

      setWorkItems(convertedItems);
      setFilteredItems(convertedItems);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('作業データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name')
        .is('deleted_at', null);

      if (error) {
        // JWT期限切れまたは認証エラーの詳細チェック
        if (error.message.includes('JWT') || 
            error.message.includes('unauthorized') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.code === 'PGRST301') {
          console.log('作業者取得時にJWT期限切れを検知:', error.message);
          navigate('/admin/login');
          return;
        }
        throw error;
      }

      setWorkers(data || []);
    } catch (err) {
      console.error('作業者データ取得エラー:', err);
    }
  };

  // ステータス番号をWorkStatusBadgeが期待する文字列に変換
  const getStatusFromNumber = (status: number | null): 'progress' | 'completed' | 'planned' | 'none' => {
    switch (status) {
      case WorkStatus.NO_PLAN: return 'none';
      case WorkStatus.PLANNED: return 'planned';
      case WorkStatus.IN_PROGRESS: return 'progress';
      case WorkStatus.COMPLETED: return 'completed';
      default: return 'none';
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideos = () => {
    navigate('/admin/work-videos');
  };

  // 検索フィルターを適用する関数
  const applyFilters = () => {
    let filtered = [...workItems];

    // フリーワード検索（作業名での前後方一致）
    if (freewordQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(freewordQuery.toLowerCase())
      );
    }

    // 納品予定日の範囲検索
    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        if (!item.deliveryDate) return false;
        
        // 日付形式を変換 (YYYY.MM.DD -> YYYY-MM-DD)
        const itemDateStr = item.deliveryDate.replace(/\./g, '-');
        const itemDate = new Date(itemDateStr);
        
        if (startDate && new Date(startDate) > itemDate) return false;
        if (endDate && new Date(endDate) < itemDate) return false;
        
        return true;
      });
    }

    // 作業者名検索
    if (selectedWorker) {
      filtered = filtered.filter((item) => 
        item.assignee === selectedWorker
      );
    }

    setFilteredItems(filtered);
  };

  // 検索ボタンクリック時の処理
  const handleSearch = () => {
    applyFilters();
  };

  // フリーワード入力時の処理
  const handleFreewordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreewordQuery(e.target.value);
  };

  // 納品予定日変更時の処理
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // 作業者選択時の処理
  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorker(e.target.value);
  };

  const handleRowClick = (id: string) => {
    // Remove special characters and spaces from the ID
    const cleanId = id.split('/')[0].trim();
    navigate(`/admin/work-detail/${encodeURIComponent(cleanId)}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
    } catch (err) {
      console.error('ログアウトエラー:', err);
      // エラーが発生してもログイン画面に遷移
      navigate('/admin/login');
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveWork = () => {
    // 作業追加後にデータを再取得
    fetchWorks();
  };

  const handleExportCSV = () => {
    exportWorkListCSV(filteredItems);
  };

  const handleDelete = async (workItem: WorkItem) => {
    const workIdNumber = workItem.id.replace('#', '');
    
    if (!confirm(`作業「${workItem.name}」を削除しますか？`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('works')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', workIdNumber)
        .is('deleted_at', null);

      if (error) {
        if (error.message.includes('JWT') || 
            error.message.includes('unauthorized') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.code === 'PGRST301') {
          navigate('/admin/login');
          return;
        }
        throw error;
      }

      alert('作業が削除されました。');
      // データを再取得
      fetchWorks();
    } catch (err) {
      console.error('作業削除エラー:', err);
      alert('作業の削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (workItem: WorkItem) => {
    // QRコードに埋め込むモックデータ
    console.log(workItem);
    const qrData = `workerid:1,workid:${workItem.id}`;

    // QRコードを生成するための隠し要素を作成
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // QRCodeCanvasをレンダリング
    const root = createRoot(tempDiv);
    const qrCodeElement = React.createElement(QRCodeCanvas, {
      value: qrData,
      size: 256,
      level: 'M'
    });
    root.render(qrCodeElement);

    // QRコードのレンダリング完了を待つ
    setTimeout(() => {
      const qrCanvas = tempDiv.querySelector('canvas');
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');

        // 印刷プレビュー用の新しいウィンドウを開く
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>QRコード印刷</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    height: 100vh;
                    margin: 0;
                  }
                  .qr-container {
                    text-align: center;
                  }
                  .qr-image {
                    border: 1px solid #ccc;
                  }
                  @media print {
                    body { 
                      margin: 0;
                      height: auto;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="qr-container">
                  <h2>作業QRコード</h2>
                  <img src="${qrDataUrl}" alt="QRコード" class="qr-image" />
                  <p>作業ID: ${workItem.id}</p>
                </div>
                <script>
                  // 少し待ってから印刷プレビューを表示
                  setTimeout(() => {
                    window.print();
                  }, 1000);
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      
      // 一時的な要素を削除
      document.body.removeChild(tempDiv);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業状況一覧</h1>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            onClick={() => navigate('/admin/worker-list')}
          >
            作業者一覧
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            ログアウト
          </button>
        </div>
      </header>
      
      <div className="p-4">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mb-4 flex space-x-2">
          <button 
            onClick={handleAccountManagement}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            アカウント管理
          </button>
          <button
            onClick={handleWorkVideos}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
        </div>
        
        <div className="bg-white rounded-md shadow-sm p-4 mb-6">
          {/* Filter controls */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              作業追加
            </button>
            
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              検索
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">フリーワード</span>
              <input
                type="text"
                value={freewordQuery}
                onChange={handleFreewordChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-48"
                placeholder="作業名で検索"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">納品予定日</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">作業者</span>
              <select
                value={selectedWorker}
                onChange={handleWorkerChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">全て</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.name || ''}>
                    {worker.name || '名前未設定'}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="ml-auto flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Download size={16} />
              <span>CSV出力</span>
            </button>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">読み込み中...</div>
              </div>
            ) : (
              <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">
                    印刷
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作業名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    進捗
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作業者名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    数量
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    単価
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    費用
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    納品予定日
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">
                    削除
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(item);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="印刷"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                    <td 
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-900 cursor-pointer"
                      onClick={() => handleRowClick(item.id)}
                    >
                      {item.id} / {item.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      <WorkStatusBadge status={item.status} />
                    </td>
                    <td 
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.assignee) {
                          navigate(`/admin/worker-detail/${encodeURIComponent(item.assignee)}`);
                        }
                      }}
                    >
                      {item.assignee || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.quantity || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.unitPrice ? `¥${item.unitPrice}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.totalCost ? `¥${item.totalCost.toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.deliveryDate || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>

      {/* 作業追加モーダル */}
      <WorkAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveWork}
      />
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkListPage;