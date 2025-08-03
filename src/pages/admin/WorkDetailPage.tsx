import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { WorkStatus } from '../../constants/workStatus';
import { Edit, Play, Save, X } from 'lucide-react';

type WorkWithWorker = Database['public']['Tables']['works']['Row'] & {
  workers?: {
    id: number;
    name: string | null;
  } | null;
};

type Worker = Database['public']['Tables']['workers']['Row'];

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workItem, setWorkItem] = useState<WorkWithWorker | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<{
    work_title: string;
    worker_id: number | null;
    quantity: number | null;
    unit_price: number | null;
    delivery_date: string | null;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkDetail();
      fetchWorkers();
    }
  }, [id]);

  const fetchWorkDetail = async () => {
    try {
      setLoading(true);
      setError('');

      // URLパラメータからIDを取得（#を除去）
      const cleanId = decodeURIComponent(id).replace('#', '');
      
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          workers (
            id,
            name
          )
        `)
        .eq('id', cleanId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('指定された作業が見つかりません');
          return;
        }
        
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

      if (!data) {
        setError('作業データが見つかりません');
        return;
      }

      setWorkItem(data as WorkWithWorker);
      setEditedItem({
        work_title: data.work_title || '',
        worker_id: data.worker_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        delivery_date: data.delivery_date
      });
    } catch (err) {
      console.error('作業詳細取得エラー:', err);
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
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('作業者一覧取得エラー:', err);
    }
  };

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideos = () => {
    navigate('/admin/work-videos');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (workItem) {
      setEditedItem({
        work_title: workItem.work_title || '',
        worker_id: workItem.worker_id,
        quantity: workItem.quantity,
        unit_price: workItem.unit_price,
        delivery_date: workItem.delivery_date
      });
    }
  };

  const handleSave = async () => {
    if (!workItem || !editedItem || !id) return;

    try {
      setLoading(true);
      const cleanId = decodeURIComponent(id).replace('#', '');

      const updateData = {
        work_title: editedItem.work_title,
        worker_id: editedItem.worker_id,
        quantity: editedItem.quantity,
        unit_price: editedItem.unit_price,
        delivery_date: editedItem.delivery_date,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('works')
        .update(updateData)
        .eq('id', cleanId)
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

      // データを再取得して表示を更新
      await fetchWorkDetail();
      setIsEditing(false);
      alert('変更が保存されました。');
    } catch (err) {
      console.error('作業更新エラー:', err);
      alert('変更の保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        [field]: value
      });
    }
  };

  // ステータス番号を日本語に変換
  const getStatusText = (status: number | null): string => {
    switch (status) {
      case WorkStatus.NO_PLAN: return '予定なし';
      case WorkStatus.PLANNED: return '予定';
      case WorkStatus.IN_PROGRESS: return '着手中';
      case WorkStatus.COMPLETED: return '完了';
      default: return '予定なし';
    }
  };

  // ステータス番号からバッジのスタイルを取得
  const getStatusBadgeClass = (status: number | null): string => {
    switch (status) {
      case WorkStatus.NO_PLAN: return 'bg-gray-100 text-gray-800';
      case WorkStatus.PLANNED: return 'bg-yellow-100 text-yellow-800';
      case WorkStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case WorkStatus.COMPLETED: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  };

  // 費用計算
  const calculateTotalCost = (): number => {
    if (!editedItem?.quantity || !editedItem?.unit_price) return 0;
    return editedItem.quantity * editedItem.unit_price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600 text-sm">⋮⋮⋮</span>
            </div>
            <h1 className="text-lg font-medium">作業詳細</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleWorkList}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              作業状況一覧
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              ログアウト
            </button>
          </div>
        </header>
        <div className="p-8 text-center">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !workItem || !editedItem) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600 text-sm">⋮⋮⋮</span>
            </div>
            <h1 className="text-lg font-medium">作業詳細</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleWorkList}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              作業状況一覧
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              ログアウト
            </button>
          </div>
        </header>
        <div className="p-8 text-center">
          <p>{error || '作業が見つかりませんでした。'}</p>
          <button
            onClick={handleWorkList}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業詳細</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleWorkList}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            作業状況一覧
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
        
        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="mb-6 flex space-x-2">
            {!isEditing && (
              <button
                onClick={handleWorkList}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                一覧に戻る
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Edit size={16} />
                <span>編集</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Save size={16} />
                  <span>保存</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <X size={16} />
                  <span>キャンセル</span>
                </button>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Work Details */}
            <div className="space-y-6">
              {/* 作業ID - 編集不可（自動採番のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業ID</label>
                <div className="text-lg text-gray-900 ml-8">#{workItem.id}</div>
              </div>
              
              {/* 作業名 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業名</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedItem.work_title}
                      onChange={(e) => handleInputChange('work_title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{workItem.work_title || '未設定'}</div>
                  )}
                </div>
              </div>
              
              {/* 作業者名 - 編集可能（セレクトボックス） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業者名</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <select
                      value={editedItem.worker_id || ''}
                      onChange={(e) => handleInputChange('worker_id', parseInt(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="">選択してください</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name || '名前未設定'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg text-gray-900">{workItem.workers?.name || '-'}</div>
                  )}
                </div>
              </div>
              
              {/* 数量 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">数量</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedItem.quantity || ''}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{workItem.quantity || '-'}</div>
                  )}
                </div>
              </div>
              
              {/* 単価 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">単価</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedItem.unit_price || ''}
                      onChange={(e) => handleInputChange('unit_price', parseInt(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">
                      ¥{(workItem.unit_price || 0).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 費用 - 編集不可（自動計算のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">費用</label>
                <div className="ml-8 flex-1">
                  <div className="text-lg text-gray-900">
                    ¥{calculateTotalCost().toLocaleString()}
                  </div>
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 数量 × 単価で自動計算されます
                    </div>
                  )}
                </div>
              </div>
              
              {/* 納品予定日 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">納品予定日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedItem.delivery_date || ''}
                      onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{formatDate(workItem.delivery_date)}</div>
                  )}
                </div>
              </div>
              
              {/* 進捗ステータス - 編集不可（自動反映のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">進捗ステータス</label>
                <div className="ml-8">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(workItem.status)}`}>
                    {getStatusText(workItem.status)}
                  </span>
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 作業の進行状況に応じて自動反映されます
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Work Video */}
            <div className="flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">作業手順動画</h3>
              <div className="bg-gray-300 aspect-video rounded-md flex items-center justify-center relative group cursor-pointer hover:bg-gray-400 transition-colors">
                <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-80 rounded-full group-hover:bg-opacity-100 transition-all">
                  <Play size={24} className="text-gray-600 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkDetailPage;