import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, QrCode, LogOut, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { Tables } from '../../types/database.types';
import { isValidYouTubeUrl, generateVideoThumbnail } from '../../utils/video';
import VideoPlayerModal from '../../components/VideoPlayerModal';

type WorkType = Tables<'works'> & {
  work_videos?: Tables<'work_videos'>[];
};

const WorkerWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentWork, setCurrentWork] = useState<WorkType | null>(null);
  const [workVideo, setWorkVideo] = useState<Tables<'work_videos'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          setError('作業者情報が見つかりません');
          return;
        }

        // 進行中の作業を取得（status = 3: 着手中）
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select(`
            *,
            work_videos!inner (
              id,
              video_title,
              video_url
            )
          `)
          .eq('worker_id', workerData.id)
          .eq('status', 3)
          .is('deleted_at', null)
          .is('work_videos.deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (workError) {
          console.error('作業データ取得エラー:', workError);
          setError('作業データの取得に失敗しました');
          return;
        }

        if (workData && workData.length > 0) {
          setCurrentWork(workData[0]);
          const video = workData[0].work_videos?.[0] || null;
          setWorkVideo(video);
          
          // サムネイル生成
          if (video) {
            generateThumbnailForVideo(video);
          }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/worker/login');
  };

  const handleMyPage = () => {
    navigate('/worker/mypage');
  };

  const handleQRCodeScan = () => {
    navigate('/worker/qr-scanner');
  };


  const getStatusColor = (status: number) => {
    switch (status) {
      case 3:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      case 1:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 3:
        return '着手中';
      case 2:
        return '予定';
      case 4:
        return '完了';
      case 1:
        return '予定なし';
      default:
        return '';
    }
  };

  const generateThumbnailForVideo = async (video: Tables<'work_videos'>) => {
    if (video.video_url && !isValidYouTubeUrl(video.video_url)) {
      try {
        const thumbnail = await generateVideoThumbnail(video.video_url);
        setVideoThumbnail(thumbnail);
      } catch (error) {
        console.error('サムネイル生成エラー:', error);
      }
    }
  };

  const handleVideoClick = () => {
    if (workVideo?.video_url) {
      setSelectedVideo({
        url: workVideo.video_url,
        title: workVideo.video_title || 'Video'
      });
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleCompleteWork = () => {
    // 配送方法選択画面に遷移
    navigate('/worker/delivery-method');
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
            <div className="bg-white rounded-md p-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-medium">作業画面</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 border border-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
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
          <div className="flex-1 bg-white border-2 border-gray-300 rounded-md"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        {currentWork ? (
          // 進行中の作業がある場合
          <div>
            {/* 作業情報（動画含む） */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* 関連動画セクション */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">関連動画</h3>
                {workVideo ? (
                  <div
                    className="relative cursor-pointer group max-w-md"
                    onClick={handleVideoClick}
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-200">
                        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
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
                  作業ID: {currentWork.id}
                </h3>
                <div className="flex items-center space-x-4 mb-6">
                  <h4 className="text-2xl font-semibold text-gray-700">
                    {currentWork.work_title || '作業タイトル'}
                  </h4>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium text-white ${getStatusColor(currentWork.status || 0)}`}>
                    {getStatusText(currentWork.status || 0)}
                  </span>
                </div>
                
                {/* 作業詳細情報 */}
                <div className="space-y-4">
                {currentWork.quantity && (
                  <div>
                    <span className="text-gray-600 font-medium">数量: </span>
                    <span className="text-gray-800">{currentWork.quantity}</span>
                  </div>
                )}
                {currentWork.delivery_date && (
                  <div>
                    <span className="text-gray-600 font-medium">納期: </span>
                    <span className="text-gray-800">{new Date(currentWork.delivery_date).toLocaleDateString('ja-JP')}</span>
                  </div>
                )}
                {currentWork.unit_price && (
                  <div>
                    <span className="text-gray-600 font-medium">単価: </span>
                    <span className="text-gray-800">¥{currentWork.unit_price.toLocaleString()}</span>
                  </div>
                )}
                </div>
              </div>
            </div>
            
            {/* 作業完了ボタン */}
            <div className="mt-8">
              <button
                onClick={handleCompleteWork}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-3"
              >
                <CheckCircle className="w-6 h-6" />
                <span>作業完了</span>
              </button>
            </div>
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

          {/* QR Code Button - 進行中の作業がない場合のみ表示 */}
          {!currentWork && (
            <div className="mt-12">
              <button
                onClick={handleQRCodeScan}
                className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
              >
                <QrCode className="w-8 h-8" />
                <span>QRコード読み取り</span>
              </button>
            </div>
          )}
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