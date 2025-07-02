import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockWorkerDetails } from '../../data/mockData';
import { Edit, Save, X } from 'lucide-react';

const WorkerDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const workerDetail = name ? mockWorkerDetails[name] : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorker, setEditedWorker] = useState(workerDetail);

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideoList = () => {
    navigate('/admin/work-videos');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedWorker(workerDetail);
  };

  const handleSave = () => {
    if (editedWorker && name) {
      // Update the mock data (in a real app, this would be an API call)
      mockWorkerDetails[name] = { ...editedWorker };
      setIsEditing(false);
      alert('変更が保存されました。');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (editedWorker) {
      if (field.includes('.')) {
        // Handle nested fields like loginInfo.email
        const [parent, child] = field.split('.');
        setEditedWorker({
          ...editedWorker,
          [parent]: {
            ...(editedWorker as any)[parent],
            [child]: value
          }
        });
      } else {
        setEditedWorker({
          ...editedWorker,
          [field]: value
        });
      }
    }
  };

  if (!workerDetail || !editedWorker) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600 text-sm">⋮⋮⋮</span>
            </div>
            <h1 className="text-lg font-medium">作業者詳細</h1>
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
          <p>作業者が見つかりませんでした。</p>
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
          <h1 className="text-lg font-medium">作業者詳細</h1>
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
          <div className="mb-6 flex space-x-2">
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
            {/* Left Column - Worker Details */}
            <div className="space-y-6">
              {/* 氏名 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">氏名</label>
                <div className="ml-8 flex-1 flex items-center space-x-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedWorker.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <span className="text-lg text-gray-900">{editedWorker.name}</span>
                  )}
                </div>
              </div>

              {/* 生年月日 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">生年月日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedWorker.birthDate ? editedWorker.birthDate.replace(/\./g, '-') : ''}
                      onChange={(e) => handleInputChange('birthDate', e.target.value.replace(/-/g, '.'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.birthDate}</div>
                  )}
                </div>
              </div>

              {/* 住所 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">住所</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedWorker.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.address}</div>
                  )}
                </div>
              </div>

              {/* 次回来社日 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">次回来社日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedWorker.nextVisitDate ? editedWorker.nextVisitDate.replace(/\./g, '-') : ''}
                      onChange={(e) => handleInputChange('nextVisitDate', e.target.value.replace(/-/g, '.'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedWorker.nextVisitDate}</div>
                  )}
                </div>
              </div>

              {/* 単価 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">単価</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedWorker.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">¥{editedWorker.hourlyRate}</div>
                  )}
                </div>
              </div>

              {/* ログイン情報 */}
              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-medium text-gray-700 mb-4 block">ログイン情報</label>
                <div className="ml-8 space-y-4">
                  <div className="flex items-center">
                    <label className="text-xs text-gray-500 w-24 flex-shrink-0">メールアドレス</label>
                    <div className="ml-4 flex-1">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedWorker.loginInfo.email}
                          onChange={(e) => handleInputChange('loginInfo.email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{editedWorker.loginInfo.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="text-xs text-gray-500 w-24 flex-shrink-0">パスワード</label>
                    <div className="ml-4 flex-1">
                      {isEditing ? (
                        <input
                          type="password"
                          value={editedWorker.loginInfo.password}
                          onChange={(e) => handleInputChange('loginInfo.password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{editedWorker.loginInfo.password}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Group, Skills, and Work History */}
            <div className="space-y-6">
              {/* グループ表示エリア */}
              <div className="border-b border-gray-200 pb-4">
                <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
                  <span className="text-2xl text-gray-400">A</span>
                </div>
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">グループ</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <select
                        value={editedWorker.group}
                        onChange={(e) => handleInputChange('group', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="グループAA">グループAA</option>
                        <option value="グループBA">グループBA</option>
                        <option value="グループ3B">グループ3B</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900">{editedWorker.group}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* スキル */}
              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">スキル</label>
                <div className="ml-8">
                  {isEditing ? (
                    <textarea
                      value={editedWorker.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{editedWorker.skills}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 作業一覧テーブル */}
          {/* 作業一覧 - 添付画像のスタイルに合わせて修正 */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">作業一覧</h3>
            <div className="space-y-3">
              {editedWorker.workHistory.map((work, index) => (
                <div key={index} className="flex items-center space-x-4">
                  {/* 番号 */}
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    {index + 1}
                  </div>
                  
                  {/* ステータスバッジ */}
                  <div className="flex-shrink-0">
                    {work.status === 'progress' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                        着手中
                      </span>
                    )}
                    {work.status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                        完了
                      </span>
                    )}
                    {work.status === 'planned' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500 text-white">
                        予定
                      </span>
                    )}
                    {work.status === 'none' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-400 text-white">
                        -
                      </span>
                    )}
                  </div>
                  
                  {/* 作業名 */}
                  <div className="flex-1 text-sm text-gray-900">
                    {work.id} / {work.name}
                  </div>
                </div>
              ))}
              
              {/* 空の行を表示（最大3行まで） */}
              {Array.from({ length: Math.max(0, 3 - editedWorker.workHistory.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-sm font-medium text-gray-400">
                    {editedWorker.workHistory.length + index + 1}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-400 text-white">
                      -
                    </span>
                  </div>
                  <div className="flex-1 text-sm text-gray-400">
                    -
                  </div>
                </div>
              ))}
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

export default WorkerDetailPage;