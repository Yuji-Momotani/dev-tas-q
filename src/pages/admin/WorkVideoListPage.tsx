import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Video, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { WorkVideo } from '../../types/work';
import type { Database } from '../../types/database.types';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import VideoAddModal from '../../components/VideoAddModal';
import AdminLayout from '../../components/AdminLayout';
import { isValidYouTubeUrl, getYouTubeThumbnail, generateVideoThumbnail } from '../../utils/video';

// Supabaseのwork_videos型を拡張
type WorkVideoWithRelations = Database['public']['Tables']['work_videos']['Row'] & {
  admins?: {
    name: string | null;
  } | null;
};


const WorkVideoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [workVideos, setWorkVideos] = useState<WorkVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<Record<number, string>>({});

  // 認証チェックとデータ取得
  const checkAuthentication = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/admin/login');
        return;
      }
      
      // ログインユーザーのadmin IDを取得
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();
        
      if (adminError || !adminData) {
        console.error('管理者情報の取得に失敗:', adminError);
        navigate('/admin/login');
        return;
      }
      
      setCurrentAdminId(adminData.id);
      
      // 認証確認後、データを取得
      fetchWorkVideos();
    } catch (err) {
      console.error('認証チェックエラー:', err);
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // 作業動画データを取得
  const fetchWorkVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_videos')
        .select(`
          id,
          video_title,
          video_url,
          created_at,
          created_admin_id,
          admins (
            name
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // データをWorkVideo型に変換
      const videos: WorkVideo[] = (data as WorkVideoWithRelations[]).map(video => ({
        id: video.id,
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
      console.error('動画データ取得エラー:', err);
      setError('動画データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };




  const handleAddVideo = () => {
    setShowAddModal(true);
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

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  // 動画追加モーダルのサブミット処理
  const handleVideoSubmit = async (formData: {
    title: string;
    uploadType: 'file' | 'youtube';
    file: File | null;
    youtubeUrl: string;
  }) => {
    setLoading(true);
    
    try {
      // ログインユーザーのadmin IDが取得済みかチェック
      if (!currentAdminId) {
        throw new Error('ユーザー情報の取得に失敗しました。ページを再読み込みしてください。');
      }

      let videoUrl: string;

      if (formData.uploadType === 'file' && formData.file) {
        // ファイルアップロードの場合
        const fileExtension = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const filePath = `work-videos/${fileName}`;
        
        console.log('Uploading file to path:', filePath);
        
        // ファイルをアップロード
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, formData.file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw new Error(`ファイルアップロードに失敗しました: ${uploadError.message}`);
        }
        
        // アップロードしたファイルの公開URLを取得
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);
        
        videoUrl = urlData.publicUrl;
      } else {
        // YouTube URLの場合
        videoUrl = formData.youtubeUrl;
        console.log('Using YouTube URL:', videoUrl);
      }
      
      // 動画情報をデータベースに保存
      const { data: videoData, error: videoError } = await supabase
        .from('work_videos')
        .insert({
          video_title: formData.title,
          video_url: videoUrl,
          created_admin_id: currentAdminId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (videoError) throw videoError;

      alert('動画が追加されました！');
      fetchWorkVideos(); // リストを更新
    } catch (err) {
      console.error('動画追加エラー:', err);
      alert('動画の追加に失敗しました');
      throw err; // エラーを再スローして、モーダル側でハンドリングする
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('この動画を削除してもよろしいですか？')) return;

    try {
      setLoading(true);
      
      // まず、動画情報を取得してStorageのパスを確認
      const { data: videoData, error: fetchError } = await supabase
        .from('work_videos')
        .select('video_url')
        .eq('id', videoId)
        .single();

      if (fetchError) throw fetchError;

      // Storageからファイルを削除（video_urlからファイルパスを抽出）
      if (videoData?.video_url) {
        const url = new URL(videoData.video_url);
        const pathSegments = url.pathname.split('/');
        // /storage/v1/object/public/videos/work-videos/filename.mp4 のようなパスから
        // work-videos/filename.mp4 を抽出
        const bucketIndex = pathSegments.indexOf('videos');
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
          const filePath = pathSegments.slice(bucketIndex + 1).join('/');
          
          const { error: storageError } = await supabase.storage
            .from('videos')
            .remove([filePath]);
          
          if (storageError) {
            console.warn('Storageからの削除に失敗:', storageError);
          }
        }
      }
      
      // データベースから削除（論理削除）
      const { error } = await supabase
        .from('work_videos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', videoId);

      if (error) throw error;

      alert('動画を削除しました');
      fetchWorkVideos(); // リストを更新
    } catch (err) {
      console.error('動画削除エラー:', err);
      alert('動画の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="作業動画一覧">

        <div className="bg-white rounded-md shadow-sm p-4">
          <button
            onClick={handleAddVideo}
            className="mb-4 flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Plus size={16} />
            <span>動画追加</span>
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    動画
                  </th>
									<th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    動画タイトル
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    作成者
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    作成日時
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-center text-sm font-medium text-gray-700 w-20">
                    削除
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-6 py-8 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-6 py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : workVideos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-6 py-8 text-center text-gray-500">
                      動画がありません
                    </td>
                  </tr>
                ) : (
                  workVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td 
                        className="border border-gray-300 px-6 py-4 cursor-pointer"
                        onClick={() => handlePlayVideo(video)}
                      >
                        <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden relative group">
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
                                    <Video size={16} className="text-gray-400" />
                                  </div>
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                              
                              <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-gray-200">
                                <Video size={20} className="text-gray-400" />
                              </div>
                            </>
                          ) : (
                            // URLがない場合
                            <div className="w-full h-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                              <Video size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                        {video.title}
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                        {video.creator}
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                        {video.createdAt.toLocaleDateString('ja-JP')}
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>

      {/* 動画追加モーダル */}
      <VideoAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSubmit={handleVideoSubmit}
        loading={loading}
      />

      {/* 動画再生モーダル */}
      <VideoPlayerModal
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
        video={selectedVideo}
      />
    </AdminLayout>
  );
};

export default WorkVideoListPage;