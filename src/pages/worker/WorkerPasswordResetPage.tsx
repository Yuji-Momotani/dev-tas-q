import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Menu } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const WorkerPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const logoPath = new URL("../../assets/logo.png", import.meta.url).href;

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

      // 作業者テーブルに該当メールアドレスが存在するか確認
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .single();

      if (workerError || !workerData) {
        // 作業者でない場合でも、セキュリティのため成功したように見せる
        setSuccess(true);
        return;
      }

      // 作業者であることが確認できたので、パスワードリセットメールを送信
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/worker/auth/callback?type=recovery`,
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-600 text-white py-4 px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-1 w-8">
              <img 
                src={logoPath}
                alt="ロゴ"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl font-medium">パスワードリセット</h1>
          </div>
        </header>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">メール送信完了</h2>
            <p className="text-gray-600 mb-6">
              パスワードリセット用のメールを送信しました。<br />
              メールを確認して、パスワードを再設定してください。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              送信先: {email}
            </p>
            <div className="space-y-3">
              <Link
                to="/worker/login"
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

        <footer className="fixed bottom-0 right-0 p-4">
          <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-md p-1 w-8">
            <img 
              src={logoPath}
              alt="ロゴ"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-medium">パスワードリセット</h1>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-400 rounded-full mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">パスワードリセット</h2>
            <p className="text-gray-600">
              登録されているメールアドレスに<br />
              パスワードリセット用のメールをお送りします。
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="○○○@XXXX.com"
                  required
                />
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
                <span>{loading ? 'メール送信中...' : 'リセットメールを送信'}</span>
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-4 text-center">
              <Link
                to="/worker/login"
                className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>ログイン画面に戻る</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 right-0 p-4">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default WorkerPasswordResetPage;