import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { inviteAdminByEmail, supabaseAdmin } from '../utils/supabaseAdmin';
import { supabase } from '../utils/supabase';
import { handleJwtExpiredError } from '../utils/auth';

interface AccountAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  navigate: (path: string) => void;
}

interface FormData {
  accountName: string;
  email: string;
  hasWorksView: boolean;
  hasWorksEdit: boolean;
  hasWorkersView: boolean;
  hasWorkersEdit: boolean;
  hasAccountsView: boolean;
  hasAccountsEdit: boolean;
  hasVideosView: boolean;
  hasVideosEdit: boolean;
}

const AccountAddModal: React.FC<AccountAddModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  navigate 
}) => {
  const [formData, setFormData] = useState<FormData>({
    accountName: '',
    email: '',
    hasWorksView: true,
    hasWorksEdit: true,
    hasWorkersView: true,
    hasWorkersEdit: true,
    hasAccountsView: true,
    hasAccountsEdit: true,
    hasVideosView: true,
    hasVideosEdit: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setFormData({
      accountName: '',
      email: '',
      hasWorksView: true,
      hasWorksEdit: true,
      hasWorkersView: true,
      hasWorkersEdit: true,
      hasAccountsView: true,
      hasAccountsEdit: true,
      hasVideosView: true,
      hasVideosEdit: true
    });
    setError('');
    setLoading(false);
    onClose();
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
          if (handleJwtExpiredError(adminError, navigate, 'admin')) {
            return;
          }
          setError('管理者の作成に失敗しました。');
        }
        return;
      }

      // admin_rolesテーブルにレコードを作成
      const rolesData = {
        admin_id: newAdmin.id,
        allow_works_view: formData.hasWorksView,
        allow_works_edit: formData.hasWorksEdit,
        allow_workers_view: formData.hasWorkersView,
        allow_workers_edit: formData.hasWorkersEdit,
        allow_accounts_view: formData.hasAccountsView,
        allow_accounts_edit: formData.hasAccountsEdit,
        allow_videos_view: formData.hasVideosView,
        allow_videos_edit: formData.hasVideosEdit,
      };

      const { error: rolesError } = await supabase
        .from('admin_roles')
        .insert([rolesData]);

      if (rolesError) {
        console.error('権限設定エラー:', rolesError);
        // 権限設定に失敗しても、管理者自体は作成されているので続行
      }

      alert('管理者が正常に作成され、招待メールを送信しました。\n管理者にメールを確認してもらい、パスワードを設定してもらってください。');
      onSuccess(); // 一覧を再取得
      handleClose();
    } catch (err) {
      console.error('管理者作成エラー:', err);
      setError('管理者の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            アカウント追加
          </h2>
          <button
            onClick={handleClose}
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
              {/* 作業状況一覧・作業詳細 */}
              <div className="border-b pb-3">
                <p className="font-medium text-sm text-gray-800 mb-2">作業状況一覧・作業詳細</p>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.hasWorksView}
                    onChange={(e) => handleFormChange('hasWorksView', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">閲覧</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasWorksEdit}
                    onChange={(e) => handleFormChange('hasWorksEdit', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">編集</span>
                </label>
              </div>
              
              {/* 作業者一覧・作業者詳細 */}
              <div className="border-b pb-3">
                <p className="font-medium text-sm text-gray-800 mb-2">作業者一覧・作業者詳細</p>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.hasWorkersView}
                    onChange={(e) => handleFormChange('hasWorkersView', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">閲覧</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasWorkersEdit}
                    onChange={(e) => handleFormChange('hasWorkersEdit', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">編集</span>
                </label>
              </div>
              
              {/* アカウント管理・アカウント詳細 */}
              <div className="border-b pb-3">
                <p className="font-medium text-sm text-gray-800 mb-2">アカウント管理・アカウント詳細</p>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.hasAccountsView}
                    onChange={(e) => handleFormChange('hasAccountsView', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">閲覧</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasAccountsEdit}
                    onChange={(e) => handleFormChange('hasAccountsEdit', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">編集</span>
                </label>
              </div>
              
              {/* 作業動画一覧 */}
              <div>
                <p className="font-medium text-sm text-gray-800 mb-2">作業動画一覧</p>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.hasVideosView}
                    onChange={(e) => handleFormChange('hasVideosView', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">閲覧</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasVideosEdit}
                    onChange={(e) => handleFormChange('hasVideosEdit', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">編集</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
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
  );
};

export default AccountAddModal;