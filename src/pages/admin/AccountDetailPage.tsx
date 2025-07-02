import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockAccountDetails } from '../../data/mockData';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accountDetail = id ? mockAccountDetails[id] : null;

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideoList = () => {
    navigate('/admin/work-videos');
  };

  if (!accountDetail) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600 text-sm">⋮⋮⋮</span>
            </div>
            <h1 className="text-lg font-medium">アカウント詳細</h1>
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
          <p>アカウントが見つかりませんでした。</p>
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
          <h1 className="text-lg font-medium">アカウント詳細</h1>
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
            onClick={handleWorkVideoList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6">
          <h2 className="text-xl font-medium mb-6">{accountDetail.name}</h2>

          <div className="space-y-8">
            {/* ログイン情報 */}
            <div>
              <h3 className="text-lg font-medium mb-4">ログイン情報</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">メール</label>
                  <input
                    type="email"
                    value={accountDetail.email}
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">パスワード</label>
                  <input
                    type="password"
                    value="********"
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  キャンセル
                </button>
                <button className="px-4 py-1 bg-black text-white rounded text-sm hover:bg-gray-800">
                  更新
                </button>
              </div>
            </div>

            {/* 権限設定 */}
            <div>
              <h3 className="text-lg font-medium mb-4">権限設定</h3>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300"></th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">閲覧</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">登録</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">更新</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">削除</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">作業状況一覧</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${accountDetail.permissions.view ? 'bg-black border-black' : 'border-gray-400'}`}>
                            {accountDetail.permissions.view && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${accountDetail.permissions.register ? 'bg-black border-black' : 'border-gray-400'}`}>
                            {accountDetail.permissions.register && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${accountDetail.permissions.update ? 'bg-black border-black' : 'border-gray-400'}`}>
                            {accountDetail.permissions.update && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${accountDetail.permissions.delete ? 'bg-black border-black' : 'border-gray-400'}`}>
                            {accountDetail.permissions.delete && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">・・・</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 bg-black border-black">
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 bg-black border-black">
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  キャンセル
                </button>
                <button className="px-4 py-1 bg-black text-white rounded text-sm hover:bg-gray-800">
                  更新
                </button>
              </div>
            </div>

            {/* 通知設定 */}
            <div>
              <h3 className="text-lg font-medium mb-4">通知設定</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">メール</label>
                  <input
                    type="email"
                    value={accountDetail.notifications.email}
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">LINE</label>
                  <input
                    type="text"
                    value={accountDetail.notifications.line}
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">Chatwork</label>
                  <input
                    type="text"
                    value={accountDetail.notifications.chatwork}
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center">
                  <label className="text-sm text-gray-700 w-24">作業者登録</label>
                  <input
                    type="checkbox"
                    checked={accountDetail.notificationSettings.workRegistration}
                    readOnly
                    className="ml-4 h-4 w-4 text-blue-600 rounded border-gray-300 "
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm text-gray-700 w-24">作業開始</label>
                  <input
                    type="checkbox"
                    checked={accountDetail.notificationSettings.workStart}
                    readOnly
                    className="ml-4 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm text-gray-700 w-24">作業終了</label>
                  <input
                    type="checkbox"
                    checked={accountDetail.notificationSettings.workComplete}
                    readOnly
                    className="ml-4 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  キャンセル
                </button>
                <button className="px-4 py-1 bg-black text-white rounded text-sm hover:bg-gray-800">
                  更新
                </button>
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

export default AccountDetailPage;