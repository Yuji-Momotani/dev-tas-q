import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const AdminPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    try {
      setLoading(true);

      // 管理者テーブルに該当メールアドレスが存在するか確認
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .single();

      if (adminError || !adminData) {
        // 管理者でない場合でも、セキュリティのため成功したように見せる
        setSuccess(true);
        return;
      }

      // 管理者であることが確認できたので、パスワードリセットメールを送信
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/auth/callback?type=recovery`,
      });

      if (resetError) {
        console.error('パスワードリセットエラー:', resetError);
        setError('パスワードリセットメールの送信に失敗しました。メールアドレスを確認してください。');
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('パスワードリセット処理エラー:', err);
      setError('パスワードリセット処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600">⋮</span>
            </div>
            <h1 className="text-lg font-medium">パスワードリセット</h1>
          </div>
        </header>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">メール送信完了</h2>
            <p className="text-gray-600 mb-6">
              パスワードリセット用のメールを送信しました。<br />
              メールを確認して、パスワードを再設定してください。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              送信先: {email}
            </p>
            <div className="space-y-3">
              <Link
                to="/admin/login"
                className="w-full inline-block bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                ログイン画面に戻る
              </Link>
              <button
                onClick={() => setSuccess(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                別のメールアドレスでリセットする
              </button>
            </div>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white py-3 px-4 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600">⋮</span>
          </div>
          <h1 className="text-lg font-medium">パスワードリセット</h1>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">管理者パスワードリセット</h2>
            <p className="text-gray-600">
              登録されているメールアドレスに<br />
              パスワードリセット用のメールをお送りします。
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="○○○@XXXX.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              <span>{loading ? 'メール送信中...' : 'リセットメールを送信'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>ログイン画面に戻る</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </div>
    </div>
  );
};

export default AdminPasswordResetPage;