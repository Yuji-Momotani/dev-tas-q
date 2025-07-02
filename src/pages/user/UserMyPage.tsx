import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Edit, Save, X, User, AlertTriangle } from 'lucide-react';

interface UserProfile {
  name: string;
  birthDate: string;
  address: string;
  nextVisitDate: string;
  email: string;
  password: string;
  profileImage: string;
  group: string;
  skills: string;
  workHistory: Array<{
    id: string;
    name: string;
    status: 'progress' | 'completed' | 'planned';
  }>;
}

const UserMyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  // モックデータ
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '山田太郎',
    birthDate: '1971.2.16',
    address: '広島県福山市西町...',
    nextVisitDate: '2025.6.18',
    email: '○○○@XXXX.com',
    password: '********',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    group: 'A',
    skills: 'スキルについての詳細が入ります。スキルについての詳細が入ります。',
    workHistory: [
      { id: '#123456', name: 'ハンダ', status: 'progress' },
      { id: '#234567', name: 'B組み立て', status: 'completed' },
      { id: '#345678', name: 'C検査', status: 'planned' }
    ]
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...userProfile });

  const handleLogout = () => {
    navigate('/user/login');
  };

  const handleBackToWork = () => {
    navigate('/user/work');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...userProfile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...userProfile });
  };

  const handleSave = () => {
    setUserProfile({ ...editedProfile });
    setIsEditing(false);
    alert('プロフィールが更新されました。');
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'progress':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      case 'planned':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'progress':
        return '着手中';
      case 'completed':
        return '完了';
      case 'planned':
        return '予定';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-medium">マイページ</h1>
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

      {/* Navigation */}
      <div className="p-4">
        <button
          onClick={handleBackToWork}
          className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors mb-6"
        >
          作業画面へ戻る
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Edit Button */}
          <div className="flex justify-end mb-6">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>編集</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>キャンセル</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>更新</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              プロフィール
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">氏名</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.name}</span>
                    )}
                  </div>
                </div>

                {/* Birth Date */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">生年月日</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedProfile.birthDate.replace(/\./g, '-')}
                        onChange={(e) => handleInputChange('birthDate', e.target.value.replace(/-/g, '.'))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.birthDate}</span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">住所</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.address}</span>
                    )}
                  </div>
                </div>

                {/* Next Visit Date */}
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">次回来社日</label>
                  <div className="ml-4 flex-1">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedProfile.nextVisitDate.replace(/\./g, '-')}
                        onChange={(e) => handleInputChange('nextVisitDate', e.target.value.replace(/-/g, '.'))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.nextVisitDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Info Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              ログイン情報
            </h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">メール</label>
                <div className="ml-4 flex-1">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <span className="text-gray-900">{userProfile.email}</span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">パスワード</label>
                <div className="ml-4 flex-1">
                  {isEditing ? (
                    <input
                      type="password"
                      value={editedProfile.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <span className="text-gray-900">{userProfile.password}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group and Skills Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Group */}
              <div>
                <div className="flex items-center justify-center w-24 h-24 bg-yellow-400 rounded-full text-4xl font-bold text-white mb-4 mx-auto shadow-lg">
                  {userProfile.group}
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700">グループ</label>
                  {isEditing ? (
                    <select
                      value={editedProfile.group}
                      onChange={(e) => handleInputChange('group', e.target.value)}
                      className="block w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  ) : (
                    <div className="mt-2 text-gray-900">{userProfile.group}</div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">スキル</h4>
                {isEditing ? (
                  <textarea
                    value={editedProfile.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">{userProfile.skills}</p>
                )}
              </div>
            </div>
          </div>

          {/* Work History Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              作業一覧
            </h3>
            
            <div className="space-y-3">
              {userProfile.workHistory.map((work, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  {/* Number */}
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-medium text-gray-700">
                    {index + 1}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(work.status)}`}>
                      {getStatusText(work.status)}
                    </span>
                  </div>
                  
                  {/* Work Name */}
                  <div className="flex-1 text-sm text-gray-900 font-medium">
                    {work.id} / {work.name}
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 3 - userProfile.workHistory.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg opacity-50">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-medium text-gray-400">
                    {userProfile.workHistory.length + index + 1}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-gray-400">
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

      {/* Footer */}
      <footer className="p-4 text-right">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default UserMyPage;