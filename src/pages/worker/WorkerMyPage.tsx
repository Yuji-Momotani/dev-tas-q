import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Edit, Save, X } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { Tables } from '../../types/database.types';
import { WorkStatus, getWorkStatusLabel, getWorkStatusBadgeClass } from '../../constants/workStatus';
import { sortWorkItems } from '../../utils/workSort';

type WorkerType = Tables<'workers'> & {
  groups?: {
    name: string | null;
  } | null;
  worker_skills?: Array<{
    comment: string | null;
    m_rank?: {
      rank: string | null;
    } | null;
  }>;
};

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
    status: number;
  }>;
}

const WorkerMyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [workerId, setWorkerId] = useState<number | null>(null);

  const unmannedPath = new URL("../../assets/unmanned.png", import.meta.url).href;
  const logoPath = new URL("../../assets/logo.png", import.meta.url).href;
  
  // デフォルト値
  const defaultProfile: UserProfile = {
    name: '未設定',
    birthDate: '',
    address: '未設定',
    nextVisitDate: '',
    email: '未設定',
    password: '********',
    profileImage: '',
    group: '未設定',
    skills: 'スキル情報が登録されていません',
    workHistory: []
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(defaultProfile);

  // 作業者情報と作業履歴を取得
  useEffect(() => {
    const fetchWorkerData = async () => {
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
          .select(`
            *,
            groups (
              name
            ),
            worker_skills (
              comment,
              m_rank (
                rank
              )
            )
          `)
          .eq('auth_user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (workerError || !workerData) {
          setError('作業者情報が見つかりません');
          return;
        }

        // 作業者IDを保存
        setWorkerId(workerData.id);

        // 作業履歴を取得
        const { data: workHistory, error: workError } = await supabase
          .from('works')
          .select('id, work_title, status, delivery_date')
          .eq('worker_id', workerData.id)
          .is('deleted_at', null)
          .limit(10);

        if (workError) {
          console.error('作業履歴取得エラー:', workError);
        }

        // プロフィールデータを整形
        const typedWorker = workerData as WorkerType;
        const skills = typedWorker.worker_skills?.map(skill => 
          skill.m_rank?.rank ? `${skill.m_rank.rank}: ${skill.comment || ''}` : skill.comment || ''
        ).join('\n') || 'スキル情報が登録されていません';

        // workSort.tsで使用する形式に変換してソート
        const workItemsForSort = (workHistory || []).map(work => ({
          id: work.id,
          workTitle: work.work_title || '',
          status: work.status as WorkStatus,
          deliveryDate: work.delivery_date ? new Date(work.delivery_date) : null,
          // その他の必須フィールドはダミーデータを設定
          workerId: workerData.id,
          quantity: 0,
          unitPrice: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        const sortedWorks = sortWorkItems(workItemsForSort);

        const profile: UserProfile = {
          name: workerData.name || '未設定',
          birthDate: workerData.birthday ? new Date(workerData.birthday).toLocaleDateString('ja-JP').replace(/\//g, '.') : '',
          address: workerData.address || '未設定',
          nextVisitDate: workerData.next_visit_date ? new Date(workerData.next_visit_date).toLocaleDateString('ja-JP').replace(/\//g, '.') : '',
          email: workerData.email || user.email || '未設定',
          password: '********',
          profileImage: '',
          group: typedWorker.groups?.name || '未設定',
          skills: skills,
          workHistory: sortedWorks.map(work => ({
            id: `#${work.id}`,
            name: work.workTitle || '未設定',
            status: work.status
          }))
        };

        setUserProfile(profile);
        setEditedProfile(profile);
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/worker/login');
  };

  const handleBackToWork = () => {
    navigate('/worker/work');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...userProfile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...userProfile });
  };

  const handleSave = async () => {
    if (!workerId) {
      setError('作業者IDが見つかりません');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // 日付のフォーマットを変換（YYYY.MM.DD -> YYYY-MM-DD）
      const formatDateForDB = (dateStr: string) => {
        if (!dateStr) return null;
        return dateStr.replace(/\./g, '-');
      };

      // 作業者情報を更新
      const { error: updateError } = await supabase
        .from('workers')
        .update({
          name: editedProfile.name,
          birthday: formatDateForDB(editedProfile.birthDate),
          address: editedProfile.address,
          next_visit_date: formatDateForDB(editedProfile.nextVisitDate),
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId);

      if (updateError) {
        console.error('作業者情報更新エラー:', updateError);
        setError('プロフィールの更新に失敗しました');
        return;
      }

      // スキル情報は現在の実装では更新しない（スキル編集には別途詳細な実装が必要）
      
      // 成功後の処理
      setUserProfile({ ...editedProfile });
      setIsEditing(false);
      alert('プロフィールが更新されました。');
      
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      setError('プロフィールの更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
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
            <h1 className="text-xl font-medium">マイページ</h1>
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

      {/* Navigation */}
      <div className="p-4">
        <button
          onClick={handleBackToWork}
          className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors mb-6"
        >
          作業画面へ戻る
        </button>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

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
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? '更新中...' : '更新'}</span>
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
                        value={editedProfile.birthDate ? editedProfile.birthDate.replace(/\./g, '-') : ''}
                        onChange={(e) => handleInputChange('birthDate', e.target.value.replace(/-/g, '.'))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.birthDate || '未設定'}</span>
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
                        value={editedProfile.nextVisitDate ? editedProfile.nextVisitDate.replace(/\./g, '-') : ''}
                        onChange={(e) => handleInputChange('nextVisitDate', e.target.value.replace(/-/g, '.'))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-gray-900">{userProfile.nextVisitDate || '未設定'}</span>
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
                  <span className="text-gray-900">{userProfile.email}</span>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">※ メールアドレスは変更できません</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">パスワード</label>
                <div className="ml-4 flex-1">
                  <span className="text-gray-900">{userProfile.password}</span>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">※ パスワードは変更できません</p>
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
                <div className="p-4 flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold text-white mb-4 mx-auto shadow-lg">
                  <img 
                    src={unmannedPath}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700">グループ</label>
                  <div className="mt-2 text-gray-900">{userProfile.group}</div>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">※ グループは管理者のみ変更可能です</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">スキル</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{userProfile.skills}</p>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-2">※ スキルは管理者のみ変更可能です</p>
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getWorkStatusBadgeClass(work.status as WorkStatus)}`}>
                      {getWorkStatusLabel(work.status as WorkStatus)}
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

        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors mb-6"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-right">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default WorkerMyPage;