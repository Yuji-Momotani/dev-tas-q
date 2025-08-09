import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const LoginPage: React.FC = () => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
        return;
      }

      if (!data.user) {
        setError('ログインに失敗しました。');
        return;
      }

      // 管理者権限チェック：adminsテーブルにレコードが存在するか確認
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .is('deleted_at', null)
        .single();

      if (adminError || !adminData) {
        // 管理者権限がない場合、セッションを破棄してログアウト
        await supabase.auth.signOut();
        setError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
        return;
      }

      // 管理者権限確認後、ログイン成功
      navigate('/admin/work-list');
    } catch (err) {
      setError('ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/admin/password-reset');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white py-3 px-4 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600">⋮</span>
          </div>
          <h1 className="text-lg font-medium">ログイン</h1>
        </div>
      </header>
      
      <div className="max-w-md mx-auto bg-white p-8 mt-8 rounded-md shadow-sm">
        <h2 className="text-xl font-medium text-center mb-6">サービス名 ログイン</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              ID
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="○○○@XXXX.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-600 space-y-2">
          <div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="underline hover:text-gray-800"
            >
              ログインID / パスワードを忘れた方
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-right text-xs text-gray-500">
          ©️〇〇〇〇会社
        </div>
      </div>
    </div>
  );
};

export default LoginPage;