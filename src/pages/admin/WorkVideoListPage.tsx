import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { mockWorkVideos } from '../../data/mockData';

const WorkVideoListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleAddVideo = () => {
    alert('動画追加機能は現在実装中です。');
  };

  const handleDeleteVideo = (videoId: string) => {
    alert(`動画ID: ${videoId} の削除機能は現在実装中です。`);
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
                {mockWorkVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4">
                      <div className="w-20 h-12 bg-gray-200 rounded"></div>
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {video.workName}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {video.creator}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {video.createdAt}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkVideoListPage;