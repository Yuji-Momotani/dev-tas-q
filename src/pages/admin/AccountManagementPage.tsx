import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import AccountAddModal from '../../components/AccountAddModal';
import AdminLayout from '../../components/AdminLayout';
import { Plus } from 'lucide-react';

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

  const handleAddAccount = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  return (
    <AdminLayout title="アカウント管理">

        <div className="bg-white rounded-md shadow-sm p-4">
          <button
            onClick={handleAddAccount}
            className="mb-4 flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Plus size={16} />
            <span>アカウント追加</span>
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    アカウント名
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    作業状況一覧・作業詳細
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    作業者一覧・作業者詳細
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    アカウント管理・アカウント詳細
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    作業動画一覧
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">閲覧</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">編集</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">閲覧</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">編集</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">閲覧</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">編集</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">閲覧</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                    <span className="font-bold">編集</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingAdmins ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
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
                        {admin.admin_roles?.allow_works_view ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_works_edit ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_workers_view ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_workers_edit ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_accounts_view ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_accounts_edit ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_videos_view ? '○' : '×'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                        {admin.admin_roles?.allow_videos_edit ? '○' : '×'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>

      {/* アカウント追加モーダル */}
      <AccountAddModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSuccess={fetchAdmins}
        navigate={navigate}
      />
    </AdminLayout>
  );
};

export default AccountManagementPage;