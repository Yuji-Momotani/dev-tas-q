import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkStatusBadge from '../../components/WorkStatusBadge';
import WorkAddModal from '../../components/WorkAddModal';
import { Work } from '../../types/work';
import { Download, Printer, Trash2, Check } from 'lucide-react';
import { exportWorkListCSV } from '../../utils/csvExport';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { WorkStatus } from '../../constants/workStatus';
import { RealtimeChannel } from '@supabase/supabase-js';

// Supabaseのworks型を拡張してWork型に対応
type WorkWithWorker = Database['public']['Tables']['works']['Row'] & {
  workers?: {
    id: number;
    name: string | null;
    unit_price_ratio: number | null;
  } | null;
};

const WorkListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状態管理
  const [workItems, setWorkItems] = useState<Work[]>([]);
  const [filteredItems, setFilteredItems] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [freewordQuery, setFreewordQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workers, setWorkers] = useState<Array<{ id: number; name: string }>>([]);

  const logoPath = new URL("../../assets/logo.png", import.meta.url).href;

  // モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Realtime channel ref
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          workers (
            id,
            name,
            unit_price_ratio
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

      // Supabaseのデータ構造をWork型に変換
      const convertedItems: Work[] = (data as WorkWithWorker[]).map((work) => ({
        id: work.id,
        title: work.work_title || '未設定',
        status: work.status || WorkStatus.REQUEST_PLANNED,
        workerName: work.workers?.name || undefined,
        workerID: work.workers?.id || undefined,
        quantity: work.quantity || undefined,
        unitPrice: work.unit_price || 0,
        deliveryDate: work.delivery_date ? new Date(work.delivery_date) : undefined,
        workerUnitPriceRatio: work.workers?.unit_price_ratio || 1.0,
      }));

      setWorkItems(convertedItems);
      setFilteredItems(convertedItems);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('作業データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // 認証チェックとデータ取得
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);
  
  // Realtime subscription setup
  useEffect(() => {
    console.log('Realtime subscription setup starting...');
    
    // チャンネルを設定
    const channel = supabase
      .channel('works-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'works'
        },
        async (payload) => {
          console.log('Work table change detected:', payload);
          
          // 変更の種類に応じて処理
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            console.log('Triggering data refetch due to:', payload.eventType);
            // データを再取得（フィルターを維持したまま）
            await fetchWorks();
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status);
        if (err) {
          console.error('Realtime subscription error:', err);
        } else if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to works table changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error occurred');
        } else if (status === 'TIMED_OUT') {
          console.error('Realtime subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('Realtime channel closed');
        }
      });
    
    // チャンネル参照を保存
    channelRef.current = channel;
    
    // クリーンアップ
    return () => {
      console.log('Cleaning up Realtime subscription...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchWorks]);

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

      setWorkers((data || []).map(worker => ({
        id: worker.id,
        name: worker.name || '名前未設定'
      })));
    } catch (err) {
      console.error('作業者データ取得エラー:', err);
    }
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
        item.title.toLowerCase().includes(freewordQuery.toLowerCase())
      );
    }

    // 納品予定日の範囲検索
    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        if (!item.deliveryDate) return false;
        
        // 日付形式を変換 (Date -> YYYY-MM-DD)
        const itemDate = item.deliveryDate;
        
        if (startDate && new Date(startDate) > itemDate) return false;
        if (endDate && new Date(endDate) < itemDate) return false;
        
        return true;
      });
    }

    // 作業者名検索
    if (selectedWorker) {
      filtered = filtered.filter((item) => 
        item.workerName === selectedWorker
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

  const handleRowClick = (id: number) => {
    navigate(`/admin/work-detail/${id}`);
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

  // 完了ボタンを表示する条件をチェック
  const canComplete = (item: Work): boolean => {
    return item.status === WorkStatus.IN_DELIVERY || 
           item.status === WorkStatus.PICKUP_REQUESTING || 
           item.status === WorkStatus.WAITING_DROPOFF;
  };

  const handleComplete = async (item: Work) => {
    if (!confirm(`作業「${item.title}」を完了にしますか？`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('works')
        .update({ 
          status: WorkStatus.COMPLETED,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
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

      alert('作業が完了しました。');
      // データを再取得
      fetchWorks();
    } catch (err) {
      console.error('作業完了エラー:', err);
      alert('作業の完了処理に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Work) => {
    if (!confirm(`作業「${item.title}」を削除しますか？`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('works')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id)
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

  const handlePrint = (item: Work) => {
    // QRコードに埋め込むモックデータ
    console.log(item);
    const qrData = `workerid:1,workid:${item.id}`;

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
                  <p>作業ID: #${item.id}</p>
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
          <div className="bg-white rounded-md p-1 w-8">
            <img 
              src={logoPath}
              alt="ロゴ"
              className="w-full h-full object-cover"
            />
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
                    完了
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
                    <td className="border border-gray-300 px-4 py-3 text-center flex justify-center">
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
                      #{item.id} / {item.title}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-500">
                      <WorkStatusBadge status={item.status} />
                    </td>
                    <td 
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.workerID) {
                          navigate(`/admin/worker-detail/${item.workerID}`);
                        }
                      }}
                    >
                      {item.workerName || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.quantity || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.unitPrice ? `¥${item.unitPrice}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {(item.quantity && item.unitPrice) ? `¥${Math.floor(item.quantity * item.unitPrice * (item.workerUnitPriceRatio || 1.0)).toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.deliveryDate ? item.deliveryDate.toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {canComplete(item) ? (
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(item);
                            }}
                            className="relative w-16 h-8 bg-gray-200 rounded-full shadow-inner transition-all duration-300 hover:bg-green-500 group"
                            title="完了"
                          >
                            <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 group-hover:translate-x-8 flex items-center justify-center">
                              <Check size={12} className="text-gray-400 group-hover:text-green-600" />
                            </div>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center flex justify-center">
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