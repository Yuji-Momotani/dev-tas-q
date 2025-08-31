import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';

type Admin = Database['public']['Tables']['admins']['Row'];
type AdminRole = Database['public']['Tables']['admin_roles']['Row'];
type AdminNotification = Database['public']['Tables']['admin_notifications']['Row'];

type AdminWithRole = Admin & {
  admin_roles?: AdminRole;
  admin_notifications?: AdminNotification[];
};

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState({
    allowWorksView: false,
    allowWorksEdit: false,
    allowWorkersView: false,
    allowWorkersEdit: false,
    allowAccountsView: false,
    allowAccountsEdit: false,
    allowVideosView: false,
    allowVideosEdit: false,
  });

  const logoPath = new URL("../../assets/logo.png", import.meta.url).href;

  useEffect(() => {
    if (id) {
      fetchAdminDetail();
    }
  }, [id]);

  const fetchAdminDetail = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('admins')
        .select(`
          *,
          admin_roles (*),
          admin_notifications (*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('管理者詳細取得エラー:', error);
        setError('管理者情報の取得に失敗しました');
        return;
      }

      if (!data) {
        setError('管理者が見つかりませんでした');
        return;
      }

      // admin_rolesは配列で返ってくるので、最初の要素を取得
      const adminWithRole: AdminWithRole = {
        ...data,
        admin_roles: data.admin_roles?.[0] || undefined,
        admin_notifications: data.admin_notifications || []
      };

      setAdmin(adminWithRole);
      
      // 権限設定をstateに設定
      setPermissions({
        allowWorksView: adminWithRole.admin_roles?.allow_works_view || false,
        allowWorksEdit: adminWithRole.admin_roles?.allow_works_edit || false,
        allowWorkersView: adminWithRole.admin_roles?.allow_workers_view || false,
        allowWorkersEdit: adminWithRole.admin_roles?.allow_workers_edit || false,
        allowAccountsView: adminWithRole.admin_roles?.allow_accounts_view || false,
        allowAccountsEdit: adminWithRole.admin_roles?.allow_accounts_edit || false,
        allowVideosView: adminWithRole.admin_roles?.allow_videos_view || false,
        allowVideosEdit: adminWithRole.admin_roles?.allow_videos_edit || false,
      });
    } catch (err) {
      console.error('管理者詳細取得処理エラー:', err);
      setError('管理者情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEmailChange = () => {
    navigate(`/admin/email-change/${id}`);
  };

  const handlePermissionChange = (permission: keyof typeof permissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const updatePermissions = async () => {
    if (!admin?.admin_roles?.id) {
      console.error('admin_roles IDが見つかりません');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({
          allow_works_view: permissions.allowWorksView,
          allow_works_edit: permissions.allowWorksEdit,
          allow_workers_view: permissions.allowWorkersView,
          allow_workers_edit: permissions.allowWorkersEdit,
          allow_accounts_view: permissions.allowAccountsView,
          allow_accounts_edit: permissions.allowAccountsEdit,
          allow_videos_view: permissions.allowVideosView,
          allow_videos_edit: permissions.allowVideosEdit,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin.admin_roles.id);

      if (error) {
        console.error('権限更新エラー:', error);
        alert('権限の更新に失敗しました');
        return;
      }

      alert('権限が正常に更新されました');
      // データを再取得して最新状態に更新
      fetchAdminDetail();
    } catch (err) {
      console.error('権限更新処理エラー:', err);
      alert('権限の更新中にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-1 w-8">
              <img 
                src={logoPath}
                alt="ロゴ"
                className="w-full h-full object-cover"
              />
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
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-1 w-8">
              <img 
                src={logoPath}
                alt="ロゴ"
                className="w-full h-full object-cover"
              />
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
          <p>{error || 'アカウントが見つかりませんでした。'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-1 w-8">
            <img 
              src={logoPath}
              alt="ロゴ"
              className="w-full h-full object-cover"
            />
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
          <h2 className="text-xl font-medium mb-6">{admin.name}</h2>

          <div className="space-y-8">
            {/* ログイン情報 */}
            <div>
              <h3 className="text-lg font-medium mb-4">ログイン情報</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 w-24">メール</label>
                  <input
                    type="email"
                    value={admin.email || ''}
                    readOnly
                    className="ml-4 flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button 
                  onClick={handleEmailChange}
                  className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  メールアドレスを変更
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
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">編集</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 作業状況一覧・作業詳細 */}
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">作業状況一覧・作業詳細</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowWorksView}
                            onChange={(e) => handlePermissionChange('allowWorksView', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowWorksEdit}
                            onChange={(e) => handlePermissionChange('allowWorksEdit', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                    </tr>
                    {/* 作業者一覧・作業者詳細 */}
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">作業者一覧・作業者詳細</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowWorkersView}
                            onChange={(e) => handlePermissionChange('allowWorkersView', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowWorkersEdit}
                            onChange={(e) => handlePermissionChange('allowWorkersEdit', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                    </tr>
                    {/* アカウント管理・アカウント詳細 */}
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">アカウント管理・アカウント詳細</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowAccountsView}
                            onChange={(e) => handlePermissionChange('allowAccountsView', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowAccountsEdit}
                            onChange={(e) => handlePermissionChange('allowAccountsEdit', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                    </tr>
                    {/* 作業動画画面 */}
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">作業動画画面</td>
                      <td className="px-4 py-3 text-center border-r border-gray-300">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowVideosView}
                            onChange={(e) => handlePermissionChange('allowVideosView', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={permissions.allowVideosEdit}
                            onChange={(e) => handlePermissionChange('allowVideosEdit', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button 
                  onClick={() => {
                    // 元の権限設定に戻す
                    setPermissions({
                      allowWorksView: admin?.admin_roles?.allow_works_view || false,
                      allowWorksEdit: admin?.admin_roles?.allow_works_edit || false,
                      allowWorkersView: admin?.admin_roles?.allow_workers_view || false,
                      allowWorkersEdit: admin?.admin_roles?.allow_workers_edit || false,
                      allowAccountsView: admin?.admin_roles?.allow_accounts_view || false,
                      allowAccountsEdit: admin?.admin_roles?.allow_accounts_edit || false,
                      allowVideosView: admin?.admin_roles?.allow_videos_view || false,
                      allowVideosEdit: admin?.admin_roles?.allow_videos_edit || false,
                    });
                  }}
                  className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button 
                  onClick={updatePermissions}
                  className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  権限を更新
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