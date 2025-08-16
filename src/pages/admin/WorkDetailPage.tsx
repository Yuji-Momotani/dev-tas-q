import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { WorkStatus } from '../../constants/workStatus';
import { Edit, Save, X, Video } from 'lucide-react';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import { isValidYouTubeUrl, getYouTubeThumbnail, generateVideoThumbnail } from '../../utils/video';
import { WorkVideo } from '../../types/work';

type WorkWithWorker = Database['public']['Tables']['works']['Row'] & {
  workers?: {
    id: number;
    name: string | null;
    unit_price_ratio: number | null;
  } | null;
};

type Worker = Database['public']['Tables']['workers']['Row'];

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workItem, setWork] = useState<WorkWithWorker | null>(null);
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
  const [workVideos, setWorkVideos] = useState<WorkVideo[]>([]);
  const [videoThumbnails, setVideoThumbnails] = useState<Record<number, string>>({});
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkDetail();
      fetchWorkers();
      fetchWorkVideos();
    }
  }, [id]);

  const fetchWorkDetail = async () => {
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
        .eq('id', Number(id))
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

      setWork(data as WorkWithWorker);
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

  // 作業に紐づく動画データを取得
  const fetchWorkVideos = async () => {
    try {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('work_videos')
        .select(`
          id,
          video_title,
          video_url,
          created_at,
          created_admin_id,
          work_id,
          admins (
            name
          )
        `)
        .eq('work_id', Number(id))
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

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

      // データをWorkVideo型に変換
      const videos: WorkVideo[] = (data || []).map((video: any) => ({
        id: video.id,
        workID: video.work_id || 0,
        title: video.video_title || '無題',
        creator: video.admins?.name || '不明',
        createdAt: video.created_at ? new Date(video.created_at) : new Date(),
        videoUrl: video.video_url || undefined
      }));

      setWorkVideos(videos);

      // アップロード動画のサムネイルを生成
      videos.forEach(async (video) => {
        if (video.videoUrl && !isValidYouTubeUrl(video.videoUrl)) {
          try {
            const thumbnailDataUrl = await generateVideoThumbnail(video.videoUrl);
            setVideoThumbnails(prev => ({
              ...prev,
              [video.id]: thumbnailDataUrl
            }));
          } catch (error) {
            console.warn(`動画ID ${video.id} のサムネイル生成に失敗:`, error);
          }
        }
      });
    } catch (err) {
      console.error('作業動画取得エラー:', err);
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

  const handlePlayVideo = (video: WorkVideo) => {
    if (video.videoUrl) {
      setSelectedVideo({ url: video.videoUrl, title: video.title });
      setShowVideoModal(true);
    } else {
      alert('動画URLが設定されていません');
    }
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
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
        .eq('id', Number(id))
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

  // 費用計算: 数量 × 単価 × 単価率（小数点切り捨て）
  const calculateTotalCost = (): number => {
    if (!editedItem?.quantity || !editedItem?.unit_price) return 0;
    const unitPriceRatio = workItem?.workers?.unit_price_ratio || 1.0;
    return Math.floor(editedItem.quantity * editedItem.unit_price * unitPriceRatio);
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
              
              {/* 単価率 - 編集不可（作業者に紐づく） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">単価率</label>
                <div className="ml-8 flex-1">
                  <div className="text-lg text-gray-900">
                    {(workItem?.workers?.unit_price_ratio || 1.0).toFixed(1)}
                  </div>
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
										<>
											<div className="text-xs text-gray-500 mt-1">
												※ 数量 × 単価 × 単価率で自動計算されます
											</div>
											<div className="text-xs text-gray-500 mt-1">
												※ 小数点は切捨て
											</div>
										</>
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
              {workVideos.length > 0 ? (
                <div className="space-y-4">
                  {workVideos.map((video) => (
                    <div key={video.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{video.title}</h4>
                      <div 
                        className="aspect-video bg-gray-200 rounded-md overflow-hidden relative group cursor-pointer"
                        onClick={() => handlePlayVideo(video)}
                      >
                        {video.videoUrl ? (
                          <>
                            {isValidYouTubeUrl(video.videoUrl) ? (
                              // YouTube動画の場合
                              <img 
                                src={getYouTubeThumbnail(video.videoUrl) || ''}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // エラー時はデフォルトアイコンに戻す
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.fallback-icon');
                                    if (fallback) fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : videoThumbnails[video.id] ? (
                              // アップロード動画でサムネイルが生成済みの場合
                              <img 
                                src={videoThumbnails[video.id]}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              // アップロード動画でサムネイル生成中の場合
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <div className="animate-pulse">
                                  <Video size={32} className="text-gray-400" />
                                </div>
                              </div>
                            )}
                            
                            {/* 再生ボタンオーバーレイ */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-90 rounded-full">
                                  <svg className="w-8 h-8 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            
                            <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-gray-200">
                              <Video size={32} className="text-gray-400" />
                            </div>
                          </>
                        ) : (
                          // URLがない場合
                          <div className="w-full h-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                            <Video size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        作成者: {video.creator} | 作成日: {video.createdAt.toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 aspect-video rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <Video size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">動画なし</p>
                    <p className="text-gray-400 text-xs mt-1">この作業には動画が登録されていません</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>

      {/* 動画再生モーダル */}
      <VideoPlayerModal
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
        video={selectedVideo}
      />
    </div>
  );
};

export default WorkDetailPage;