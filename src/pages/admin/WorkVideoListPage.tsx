import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Video } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { WorkVideo } from '../../types/work';
import type { Database } from '../../types/database.types';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import VideoAddModal from '../../components/VideoAddModal';
import { isValidYouTubeUrl, getYouTubeThumbnail, generateVideoThumbnail } from '../../utils/video';

// Supabaseのwork_videos型を拡張
type WorkVideoWithRelations = Database['public']['Tables']['work_videos']['Row'] & {
  works?: {
    id: number;
    work_title: string | null;
  } | null;
  admins?: {
    name: string | null;
  } | null;
};


const WorkVideoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [workVideos, setWorkVideos] = useState<WorkVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [adminList, setAdminList] = useState<{ id: number; name: string }[]>([]);
  const [workList, setWorkList] = useState<{ id: number; title: string; hasVideo?: boolean }[]>([]);
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
      // 認証確認後、データを取得
      fetchWorkVideos();
      fetchAdmins();
      fetchWorks();
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
          work_id,
          works (
            id,
            work_title
          ),
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
        workID: video.work_id || 0,
        title: video.video_title || '無題',
        creator: video.admins?.name || '不明',
        createdAt: video.created_at ? new Date(video.created_at) : new Date(),
        workTitle: video.works?.work_title || undefined,
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

  // 管理者リストを取得
  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name')
        .is('deleted_at', null);

      if (error) throw error;

      setAdminList((data || []).map(admin => ({
        id: admin.id,
        name: admin.name || '名前未設定'
      })));
    } catch (err) {
      console.error('管理者データ取得エラー:', err);
    }
  };

  // 作業リストを取得
  const fetchWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select(`
          id, 
          work_title,
          work_videos!left (
            id
          )
        `)
        .is('deleted_at', null)
        .is('work_videos.deleted_at', null)
        .order('work_title');

      if (error) throw error;

      setWorkList((data || []).map(work => ({
        id: work.id,
        title: work.work_title || '無題',
        hasVideo: work.work_videos && work.work_videos.length > 0
      })));
    } catch (err) {
      console.error('作業データ取得エラー:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
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
    creatorID: string;
    workID: string;
    uploadType: 'file' | 'youtube';
    file: File | null;
    youtubeUrl: string;
  }) => {
    setLoading(true);
    
    try {
      // 認証状態を確認
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('Auth session:', session);
      console.log('User role:', session?.user?.role);
      console.log('User ID:', session?.user?.id);
      
      if (authError || !session) {
        throw new Error('認証が必要です。ログインしてください。');
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
      const { error } = await supabase
        .from('work_videos')
        .insert({
          video_title: formData.title,
          video_url: videoUrl,
          work_id: formData.workID ? parseInt(formData.workID) : null,
          created_admin_id: parseInt(formData.creatorID),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業動画一覧</h1>
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
          <button className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            作業動画一覧
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm p-4">
          <button
            onClick={handleAddVideo}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            動画追加
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
                    関連作業
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
                    <td colSpan={6} className="border border-gray-300 px-6 py-8 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-6 py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : workVideos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-6 py-8 text-center text-gray-500">
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
                        {video.workTitle ? `#${video.workID} / ${video.workTitle}` : '-'}
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
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>

      {/* 動画追加モーダル */}
      <VideoAddModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSubmit={handleVideoSubmit}
        adminList={adminList}
        workList={workList}
        loading={loading}
      />

      {/* 動画再生モーダル */}
      <VideoPlayerModal
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
        video={selectedVideo}
      />
    </div>
  );
};

export default WorkVideoListPage;