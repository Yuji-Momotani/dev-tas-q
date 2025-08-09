import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const WorkerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
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
    
    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
        return;
      }

      if (!data.user) {
        setError('ログインに失敗しました。');
        return;
      }

      // 作業者権限チェック：workersテーブルにレコードが存在するか確認
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .is('deleted_at', null)
        .single();

      if (workerError || !workerData) {
        // 作業者権限がない場合、セッションを破棄してログアウト
        await supabase.auth.signOut();
        setError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
        return;
      }

      // 作業者権限確認後、ログイン成功
      navigate('/worker/work');
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/worker/password-reset');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-md p-2">
            <Menu className="w-5 h-5 text-gray-600" />
          </div>
          <h1 className="text-xl font-medium">ログイン</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">タスQ ログイン</h2>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
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

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="password"
                  required
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
              >
                ログインID / パスワードを忘れた方
              </button>
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

export default WorkerLoginPage;