import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Upload, X, Video } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { WorkVideo } from '../../types/work';
import type { Database } from '../../types/database.types';

// Supabaseのwork_videos型を拡張
type WorkVideoWithRelations = Database['public']['Tables']['work_videos']['Row'] & {
  works?: {
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    creatorID: '',
    file: null as File | null
  });

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
        id: video.id.toString(),
        workID: video.work_id || 0,
        title: video.video_title || '無題',
        creator: video.admins?.name || '不明',
        createdAt: video.created_at ? new Date(video.created_at) : new Date(),
      }));

      setWorkVideos(videos);
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

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      title: '',
      creator: '',
      file: null
    });
    setIsDragOver(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    } else {
      alert('動画ファイルを選択してください。');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('動画ファイルを選択してください');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: 実際のファイルアップロード実装
      // 現時点では、video_urlは仮のURLを設定
      const videoUrl = `https://example.com/videos/${Date.now()}_${formData.file.name}`;
      
      // 動画情報をデータベースに保存
      const { error } = await supabase
        .from('work_videos')
        .insert({
          video_title: formData.title,
          video_url: videoUrl,
          created_admin_id: parseInt(formData.creatorID),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('動画が追加されました！');
      handleCloseModal();
      fetchWorkVideos(); // リストを更新
    } catch (err) {
      console.error('動画追加エラー:', err);
      alert('動画の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('この動画を削除してもよろしいですか？')) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('work_videos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', parseInt(videoId));

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
                    作成者
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    作成者
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm font-medium text-gray-700">
                    作成日時
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-center text-sm font-medium text-gray-700 w-16">
                    
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
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Video size={20} className="text-gray-400" />
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
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>

      {/* 動画追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Video className="w-5 h-5 mr-2" />
                動画追加
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* ファイルアップロード欄 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  作業動画 <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-green-500 bg-green-50'
                      : formData.file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('video-file-input')?.click()}
                >
                  {formData.file ? (
                    <div className="space-y-2">
                      <Video className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-600">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, file: null }));
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        ファイルをドラッグ&ドロップするか、クリックして選択
                      </p>
                      <p className="text-xs text-gray-500">
                        対応形式: MP4, MOV, AVI, WMV
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="video-file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* タイトル */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="動画のタイトルを入力してください"
                  required
                />
              </div>

              {/* 作成者 */}
              <div className="mb-6">
                <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-2">
                  作成者 <span className="text-red-500">*</span>
                </label>
                <select
                  id="creator"
                  value={formData.creatorID}
                  onChange={(e) => handleFormChange('creatorID', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">作成者を選択してください</option>
                  {adminList.map((admin) => (
                    <option key={admin.id} value={admin.id.toString()}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!formData.file || !formData.title || !formData.creatorID || loading}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkVideoListPage;