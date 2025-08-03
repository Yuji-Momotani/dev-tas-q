import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X } from 'lucide-react';
import { inviteAdminByEmail, supabaseAdmin } from '../../utils/supabaseAdmin';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';

type Admin = Database['public']['Tables']['admins']['Row'];
type AdminRole = Database['public']['Tables']['admin_roles']['Row'];

type AdminWithRole = Admin & {
  admin_roles?: AdminRole;
};

const AccountManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [admins, setAdmins] = useState<AdminWithRole[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [formData, setFormData] = useState({
    accountName: '',
    email: '',
    hasWorkListView: false,
    hasWorkListCreate: false,
    hasWorkListUpdate: false,
    hasWorkListDelete: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      
      // adminsテーブルとadmin_rolesテーブルをJOINして取得
      const { data, error } = await supabase
        .from('admins')
        .select(`
          *,
          admin_roles (*)
        `)
        .is('deleted_at', null)
        .order('id', { ascending: true });

      if (error) {
        console.error('管理者一覧取得エラー:', error);
        return;
      }

      // admin_rolesは配列で返ってくるので、最初の要素を取得
      const adminsWithRole = (data || []).map(admin => ({
        ...admin,
        admin_roles: admin.admin_roles?.[0] || undefined
      }));

      setAdmins(adminsWithRole);
    } catch (err) {
      console.error('管理者一覧取得処理エラー:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleAddAccount = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      accountName: '',
      email: '',
      hasWorkListView: false,
      hasWorkListCreate: false,
      hasWorkListUpdate: false,
      hasWorkListDelete: false
    });
    setError('');
    setLoading(false);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 管理者の招待メールを送信
      const result = await inviteAdminByEmail(formData.email);

      if (!result.success) {
        setError(result.error || '招待メール送信に失敗しました');
        return;
      }

      // 招待されたユーザーのauth_user_idを取得
      let authUserId = null;
      if (result.user && result.user.id) {
        authUserId = result.user.id;
      }

      // adminsテーブルにレコードを作成
      const adminData = {
        email: formData.email,
        name: formData.accountName,
        auth_user_id: authUserId,
      };

      const { data: newAdmin, error: adminError } = await supabase
        .from('admins')
        .insert([adminData])
        .select()
        .single();

      if (adminError || !newAdmin) {
        // 管理者テーブル登録失敗時は、作成されたAuthユーザーを削除
        // (Supabase AuthとPostgreSQLテーブル間ではクロストランザクションできないため)
        if (authUserId) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            setError('管理者の作成に失敗しました。\n招待メールは送信されましたが、システムエラーのため取り消されました。');
          } catch (deleteError) {
            console.error('Auth ユーザー削除に失敗:', deleteError);
            setError(`管理者の作成に失敗しました。\n\n重要：管理者に以下の情報を連絡してください。\n- Supabase Authに残存するユーザー メールアドレス: ${formData.email}\n\n手動でSupabase Authからユーザーを削除する必要があります。`);
          }
        } else {
          setError('管理者の作成に失敗しました。');
        }

        if (adminError.message.includes('JWT') || 
            adminError.message.includes('unauthorized') ||
            adminError.message.includes('Invalid JWT') ||
            adminError.message.includes('expired') ||
            adminError.code === 'PGRST301') {
          setError('セッションが期限切れです。再度ログインしてください。');
        }
        return;
      }

      // admin_rolesテーブルにレコードを作成
      const rolesData = {
        admin_id: newAdmin.id,
        allow_working_get: formData.hasWorkListView,
        allow_working_create: formData.hasWorkListCreate,
        allow_working_update: formData.hasWorkListUpdate,
        allow_working_delete: formData.hasWorkListDelete,
      };

      const { error: rolesError } = await supabase
        .from('admin_roles')
        .insert([rolesData]);

      if (rolesError) {
        console.error('権限設定エラー:', rolesError);
        // 権限設定に失敗しても、管理者自体は作成されているので続行
      }

      alert('管理者が正常に作成され、招待メールを送信しました。\n管理者にメールを確認してもらい、パスワードを設定してもらってください。');
      fetchAdmins(); // 一覧を再取得
      handleCloseModal();
    } catch (err) {
      console.error('管理者作成エラー:', err);
      setError('管理者の作成に失敗しました');
    } finally {
      setLoading(false);
    }
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
                    作業状況一覧 登録
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    作業状況一覧 更新
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    作業状況一覧 削除
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingAdmins ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      管理者が登録されていません
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td 
                        className="border border-gray-300 px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/admin/account-detail/${admin.id}`)}
                      >
                        {admin.id} / {admin.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_working_get ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_working_create ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_working_update ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_working_delete ? '○' : '×'}
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

      {/* アカウント追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                アカウント追加
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
              {/* エラーメッセージ */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {/* アカウント名 */}
              <div className="mb-4">
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
                  アカウント名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => handleFormChange('accountName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="アカウント名を入力してください"
                  required
                />
              </div>

              {/* メールアドレス */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="example@example.com"
                  required
                />
              </div>


              {/* 権限設定 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  権限設定
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasWorkListView}
                      onChange={(e) => handleFormChange('hasWorkListView', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">作業状況一覧 閲覧</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasWorkListCreate}
                      onChange={(e) => handleFormChange('hasWorkListCreate', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">作業状況一覧 登録</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasWorkListUpdate}
                      onChange={(e) => handleFormChange('hasWorkListUpdate', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">作業状況一覧 更新</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasWorkListDelete}
                      onChange={(e) => handleFormChange('hasWorkListDelete', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">作業状況一覧 削除</span>
                  </label>
                </div>
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
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '招待中...' : '招待送信'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagementPage;