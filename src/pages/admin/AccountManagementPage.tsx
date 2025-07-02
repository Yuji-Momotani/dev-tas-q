import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { mockAccounts } from '../../data/mockData';

const AccountManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleAddAccount = () => {
    alert('アカウント追加機能は現在実装中です。');
  };

  const handleWorkVideoList = () => {
    navigate('/admin/work-videos');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">アカウント管理</h1>
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
          <button className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            アカウント管理
          </button>
          <button 
            onClick={handleWorkVideoList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm p-4">
          <button
            onClick={handleAddAccount}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            アカウント追加
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    アカウント名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    作業状況一覧閲覧
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    ・・・
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    メール
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    LINE
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Chatwork
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td 
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/admin/account-detail/${account.id}`)}
                    >
                      {account.id} / {account.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                      {account.hasWorkListAccess ? '○' : '×'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                      ・・・
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                      {account.hasEmailAccess ? '○' : '×'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                      {account.hasLineAccess ? '○' : '×'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                      {account.hasChatworkAccess ? '○' : '×'}
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

export default AccountManagementPage;