import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkStatusBadge from '../../components/WorkStatusBadge';
import WorkAddModal from '../../components/WorkAddModal';
import AdminLayout from '../../components/AdminLayout';
import { Work } from '../../types/work';
import { Download, Printer, Trash2, Check, Plus, Search, QrCode } from 'lucide-react';
import { exportWorkListCSV } from '../../utils/csvExport';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { WorkStatus, getWorkStatusLabel } from '../../constants/workStatus';
import { RealtimeChannel } from '@supabase/supabase-js';
import { sortWorkItems } from '../../utils/workSort';
import { handleSupabaseError } from '../../utils/auth';
import { formatDateTimeJP, formatDateJP } from '../../utils/dateFormat';

// Supabaseのworks型を拡張してWork型に対応
type WorkWithWorkerAndMaster = Database['public']['Tables']['works']['Row'] & {
  workers?: {
    id: number;
    name: string | null;
    unit_price_ratio: number | null;
  } | null;
  m_work?: {
    title: string;
    default_unit_price: number;
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
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([
    WorkStatus.REQUEST_PLANNED,
    WorkStatus.REQUESTING,
    WorkStatus.IN_PROGRESS,
    WorkStatus.IN_DELIVERY,
    WorkStatus.PICKUP_REQUESTING,
    WorkStatus.WAITING_DROPOFF
  ]);
  const [workers, setWorkers] = useState<Array<{ id: number; name: string }>>([]);

  // ページング状態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
          ),
          m_work (
            title,
            default_unit_price
          )
        `)
        .is('deleted_at', null);

      if (error) {
        handleSupabaseError(error, navigate, 'admin');
      }

      // Supabaseのデータ構造をWork型に変換
      const convertedItems: Work[] = (data as WorkWithWorkerAndMaster[]).map((work) => ({
        id: work.id,
        title: work.m_work?.title || '作業名未設定',
        status: work.status || WorkStatus.REQUEST_PLANNED,
        workerName: work.workers?.name || undefined,
        workerID: work.workers?.id || undefined,
        quantity: work.quantity,
        unitPrice: work.unit_price,
        cost: work.cost,
        deliveryDate: work.delivery_deadline ? new Date(work.delivery_deadline) : undefined,
        scheduledDeliveryDate: work.scheduled_delivery_date ? new Date(work.scheduled_delivery_date) : undefined,
        workerUnitPriceRatio: work.workers?.unit_price_ratio || 1.0,
        note: work.note || undefined,
        endedAt: work.ended_at ? new Date(work.ended_at) : undefined,
      }));

      // ソート処理を適用
      const sortedItems = sortWorkItems(convertedItems);

      setWorkItems(sortedItems);
      setFilteredItems(sortedItems);
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
        handleSupabaseError(error, navigate, 'admin');
      }

      setWorkers((data || []).map(worker => ({
        id: worker.id,
        name: worker.name || '名前未設定'
      })));
    } catch (err) {
      console.error('作業者データ取得エラー:', err);
    }
  };


  // 検索フィルターとソートを適用する関数
  const applyFilters = () => {
    let filtered = [...workItems];

    // フリーワード検索（作業名での前後方一致）
    if (freewordQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(freewordQuery.toLowerCase())
      );
    }

    // 納入締切日の範囲検索
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

    // 進捗状態検索
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) => 
        selectedStatuses.includes(item.status)
      );
    }

    // ソート適用
    const sortedFiltered = sortWorkItems(filtered);
    setFilteredItems(sortedFiltered);
  };

  // workItemsが更新された時のみフィルターを適用（初回データ取得時）
  useEffect(() => {
    applyFilters();
  }, [workItems]);

  // ページング用の計算
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // 表示件数変更時の処理
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ページ変更時の処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // フィルター適用時にページをリセット
  const handleSearchWithReset = () => {
    setCurrentPage(1);
    applyFilters();
  };

  // 検索ボタンクリック時の処理
  const handleSearch = () => {
    handleSearchWithReset();
  };

  // フリーワード入力時の処理
  const handleFreewordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreewordQuery(e.target.value);
  };

  // 納入締切日変更時の処理
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

  // 進捗状態選択時の処理
  const handleStatusChange = (status: number) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleRowClick = (id: number) => {
    navigate(`/admin/work-detail/${id}`);
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
      
      // JST時間を取得
      const now = new Date();
      const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9時間
      
      const { error } = await supabase
        .from('works')
        .update({ 
          status: WorkStatus.COMPLETED,
          ended_at: jstTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .is('deleted_at', null);

      if (error) {
        handleSupabaseError(error, navigate, 'admin');
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
        handleSupabaseError(error, navigate, 'admin');
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
                    max-width: 600px;
                  }
                  .qr-image {
                    border: 1px solid #ccc;
                    margin-bottom: 20px;
                  }
                  .work-details {
                    text-align: left;
                    margin-top: 20px;
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                  }
                  .work-details p {
                    margin: 8px 0;
                    line-height: 1.4;
                  }
                  @media print {
                    body { 
                      margin: 0;
                      height: auto;
                    }
                    .work-details {
                      background-color: white !important;
                      border: 1px solid #000 !important;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="qr-container">
                  <h2>作業QRコード</h2>
                  <img src="${qrDataUrl}" alt="QRコード" class="qr-image" />
                  <div class="work-details">
                    <p><strong>作業ID:</strong> #${item.id}</p>
                    <p><strong>作業名:</strong> ${item.title}</p>
                    <p><strong>作業者名:</strong> ${item.workerName || '未指定'}</p>
                    <p><strong>数量:</strong> ${item.quantity}</p>
                    <p><strong>単価:</strong> ¥${item.unitPrice?.toLocaleString() || '0'}</p>
                    <p><strong>費用:</strong> ¥${item.cost.toLocaleString()}</p>
                    <p><strong>納入締切日:</strong> ${item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('ja-JP') : '未指定'}</p>
                    <p><strong>特記事項:</strong> ${item.note || 'なし'}</p>
                  </div>
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

  const handleQRScan = () => {
    navigate('/admin/qr-scanner');
  };

  return (
    <AdminLayout title="作業状況一覧">
      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
        
        <div className="bg-white rounded-md shadow-sm p-4 mb-6">
          {/* 1行目: ボタン群と基本検索条件 */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Plus size={16} />
              <span>作業追加</span>
            </button>
            
            <button 
              onClick={handleSearch}
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Search size={16} />
              <span>検索</span>
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
              <span className="text-sm font-medium">納入締切日</span>
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
          </div>

          {/* 2行目: 進捗検索条件 */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">進捗</span>
            <div className="flex flex-wrap gap-4 p-3 border border-gray-300 rounded bg-gray-50">
              {Object.values(WorkStatus).filter(value => typeof value === 'number').map((status) => (
                <label key={status} className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status as number)}
                    onChange={() => handleStatusChange(status as number)}
                    className="rounded border-gray-300 focus:ring-green-500"
                  />
                  <span>{getWorkStatusLabel(status as WorkStatus)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3行目: 表示件数選択 */}
          <div className="flex items-center space-x-4 mb-4 justify-end">
            <span className="text-sm font-medium">表示件数</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
            <span className="text-sm text-gray-600">
              全{filteredItems.length}件中 {startIndex + 1}～{Math.min(endIndex, filteredItems.length)}件を表示
            </span>

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
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-28">
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
                    納入締切日
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-40">
                    納品予定日
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    特記事項
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
                {currentItems.map((item) => (
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
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {`¥${item.unitPrice}`}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {`¥${item.cost.toLocaleString()}`}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {formatDateJP(item.deliveryDate)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {formatDateTimeJP(item.scheduledDeliveryDate)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500" title={item.note || ''}>
                      {item.note ? (item.note.length > 30 ? `${item.note.substring(0, 30)}...` : item.note) : '-'}
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

          {/* ページングコントロール */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                前へ
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // 最初の3ページ、最後の3ページ、現在のページの前後2ページを表示
                const showPage =
                  page <= 3 ||
                  page > totalPages - 3 ||
                  (page >= currentPage - 2 && page <= currentPage + 2);

                if (!showPage) {
                  // 省略記号を表示
                  const isFirstEllipsis = page === 4 && currentPage > 6;
                  const isSecondEllipsis = page === totalPages - 3 && currentPage < totalPages - 5;

                  if (isFirstEllipsis || isSecondEllipsis) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === page
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                次へ
              </button>
            </div>
          )}
        </div>

      {/* 作業追加モーダル */}
      <WorkAddModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveWork}
      />
      
      {/* QRコード読み取りボタン（右下フロート） */}
      <button
        onClick={handleQRScan}
        className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
        title="QRコード読み取り"
      >
        <QrCode size={24} />
      </button>

      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </AdminLayout>
  );
};

export default WorkListPage;