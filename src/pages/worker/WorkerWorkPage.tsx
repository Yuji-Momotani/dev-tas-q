import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, QrCode, LogOut, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { Tables } from '../../types/database.types';
import { isValidYouTubeUrl, generateVideoThumbnail } from '../../utils/video';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import { WorkStatus, getWorkStatusLabel } from '../../constants/workStatus';
import { handleSupabaseError } from '../../utils/auth';

type WorkType = Tables<'works'> & {
  work_videos?: Tables<'work_videos'>;
};

const WorkerWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentWorks, setCurrentWorks] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<{[key: number]: string}>({});

  const logoPath = new URL("../../assets/logo.png", import.meta.url).href;

  // 作業者の認証状態と作業データを取得
  useEffect(() => {
    const fetchWorkerWork = async () => {
      try {
        setLoading(true);
        setError('');

        // 現在のユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/worker/login');
          return;
        }

        // 作業者情報を取得
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .eq('auth_user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (workerError || !workerData) {
          try {
            handleSupabaseError(workerError, navigate, 'worker', 'worker information retrieval');
          } catch (e) {
            setError('作業者情報が見つかりません');
            return;
          }
        }

        // 進行中の作業を全て取得
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select(`
            *,
            work_videos:work_videos_id (
              id,
              video_title,
              video_url
            ),
            m_work (
              title,
              unit_price
            )
          `)
          .eq('worker_id', workerData.id)
          .eq('status', WorkStatus.IN_PROGRESS)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false });

        if (workError) {
          console.error('作業データ取得エラー:', workError);
          try {
            handleSupabaseError(workError, navigate, 'worker', 'work data retrieval');
          } catch (e) {
            setError('作業データの取得に失敗しました');
            return;
          }
        }

        if (workData && workData.length > 0) {
          setCurrentWorks(workData);
          
          // 各作業の動画サムネイルを生成
          workData.forEach((work) => {
            const video = work.work_videos;
            if (video && work.id) {
              generateThumbnailForVideo(video, work.id);
            }
          });
        }
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerWork();
  }, [navigate]);

  // QRコード読み取り結果を処理
  useEffect(() => {
    const qrResult = sessionStorage.getItem('qrResult');
    if (qrResult) {
      // QRコード読み取り後の処理をここに実装
      // 現在は読み取り結果をクリアするだけ
      sessionStorage.removeItem('qrResult');
      // ページをリロードして最新の作業状態を取得
      window.location.reload();
    }
  }, []);

  // const handleLogout = async () => {
  //   await supabase.auth.signOut();
  //   navigate('/worker/login');
  // };

  const handleMyPage = () => {
    navigate('/worker/mypage');
  };

  const handleQRCodeScan = () => {
    navigate('/worker/qr-scanner');
  };


  const getStatusColor = (status: number) => {
    switch (status) {
      case WorkStatus.IN_PROGRESS:
        return 'bg-red-500';
      case WorkStatus.REQUESTING:
        return 'bg-yellow-500';
      case WorkStatus.IN_DELIVERY:
      case WorkStatus.PICKUP_REQUESTING:
      case WorkStatus.WAITING_DROPOFF:
      case WorkStatus.COMPLETED:
        return 'bg-green-500';
      case WorkStatus.REQUEST_PLANNED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: number) => {
    return getWorkStatusLabel(status as WorkStatus);
  };

  const generateThumbnailForVideo = async (video: Tables<'work_videos'>, workId: number) => {
    if (video.video_url && !isValidYouTubeUrl(video.video_url)) {
      try {
        const thumbnail = await generateVideoThumbnail(video.video_url);
        setVideoThumbnails(prev => ({ ...prev, [workId]: thumbnail }));
        console.log('✅ サムネイル生成成功 - 作業ID:', workId);
      } catch (error) {
        console.error('❌ サムネイル生成エラー - 作業ID:', workId, error);
        console.log('⚠️ サムネイル表示なしで動画再生は可能です');
        // エラーを無視して処理続行（動画再生には影響しない）
      }
    }
  };

  const handleVideoClick = (video: Tables<'work_videos'>) => {
    if (video?.video_url) {
      setSelectedVideo({
        url: video.video_url,
        title: video.video_title || 'Video'
      });
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleCompleteWork = (workId: number) => {
    // 作業IDをパスパラメータとして配送方法選択画面に遷移
    navigate(`/worker/delivery-method/${workId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-1 w-8">
              <img 
                src={logoPath}
                alt="ロゴ"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl font-medium">作業画面</h1>
          </div>
          {/* <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 border border-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button> */}
        </div>
      </header>

      {/* Navigation Buttons */}
      <div className="p-4">
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleMyPage}
            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            マイページ
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        {currentWorks.length > 0 ? (
          // 進行中の作業がある場合
          <div className="space-y-6">
            {/* 各作業をカード形式で表示 */}
            {currentWorks.map((work) => {
              const workVideo = work.work_videos || null;
              const videoThumbnail = work.id ? videoThumbnails[work.id] : '';
              
              return (
                <div key={work.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* 関連動画セクション */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">関連動画</h3>
                    {workVideo ? (
                      <div
                        className="relative cursor-pointer group max-w-md"
                        onClick={() => handleVideoClick(workVideo)}
                      >
                        <div className="w-full bg-gray-200 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                          {isValidYouTubeUrl(workVideo.video_url || '') ? (
                            <img
                              src={`https://img.youtube.com/vi/${workVideo.video_url?.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`}
                              alt={workVideo.video_title || 'Video thumbnail'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://img.youtube.com/vi/${workVideo.video_url?.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`;
                              }}
                            />
                          ) : videoThumbnail ? (
                            <img
                              src={videoThumbnail}
                              alt={workVideo.video_title || 'Video thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                            <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video title */}
                        <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                          {workVideo.video_title || '作業手順動画'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">動画なし</p>
                        <p className="text-gray-500 text-sm mt-1">この作業に関連する動画はありません</p>
                      </div>
                    )}
                  </div>

                  {/* 作業情報 */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-3xl font-bold text-gray-800 mb-6">
                      作業ID: {work.id}
                    </h3>
                    <div className="flex items-center space-x-4 mb-6">
                      <h4 className="text-2xl font-semibold text-gray-700">
                        {work.m_work?.title || '作業タイトル'}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-4 mb-6">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium text-white ${getStatusColor(work.status || 0)}`}>
                        {getStatusText(work.status || 0)}
                      </span>
                    </div>
                    
                    {/* 作業詳細情報 */}
                    <div className="space-y-4">
                    {work.quantity && (
                      <div>
                        <span className="text-gray-600 font-medium">数量: </span>
                        <span className="text-gray-800">{work.quantity}</span>
                      </div>
                    )}
                    {work.delivery_date && (
                      <div>
                        <span className="text-gray-600 font-medium">納期: </span>
                        <span className="text-gray-800">{new Date(work.delivery_date).toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                    {work.m_work?.unit_price && (
                      <div>
                        <span className="text-gray-600 font-medium">単価: </span>
                        <span className="text-gray-800">¥{work.m_work.unit_price.toLocaleString()}</span>
                      </div>
                    )}
                    {work.note && (
                      <div>
                        <span className="text-gray-600 font-medium">特記事項: </span>
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded border mt-1">
                          {work.note}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                  
                  {/* 各作業の完了ボタン */}
                  <div className="mt-6">
                    <button
                      onClick={() => handleCompleteWork(work.id!)}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-3"
                    >
                      <CheckCircle className="w-6 h-6" />
                      <span>この作業を完了</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            // 作業がない場合の表示（作業待機中）
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                作業待機中
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                以下の「QRコード読み取り」ボタンを押し、段ボールに記載のQRコードを読み取ってください。
              </p>
            </div>
          )}

          {/* QR Code Button - 常に表示 */}
          <div className="mt-12">
            <button
              onClick={handleQRCodeScan}
              className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
            >
              <QrCode className="w-8 h-8" />
              <span>QRコード読み取り</span>
            </button>
          </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        video={selectedVideo}
      />

      {/* Footer */}
      <footer className="p-4 text-right">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default WorkerWorkPage;