import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Menu } from 'lucide-react';

const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});
  const [rememberMe, setRememberMe] = useState(true);

  const validateForm = (): boolean => {
    const newErrors: { id?: string; password?: string } = {};
    
    if (!id.trim()) {
      newErrors.id = 'IDを入力してください';
    }
    
    if (!password.trim()) {
      newErrors.password = 'パスワードを入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // TODO: Implement actual authentication logic
      console.log('User login attempt:', { id, password, rememberMe });
      // ログイン成功後、作業画面に遷移
      navigate('/user/work');
    }
  };

  const handleGoogleLogin = () => {
    alert('Googleアカウントでのログイン機能は実装予定です');
  };

  const handleForgotPassword = () => {
    alert('パスワードリセット機能は実装予定です');
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">タスク ログイン</h2>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* ID Field */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
                  ID
                </label>
                <input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="○○○@XXXX.com"
                />
                {errors.id && (
                  <p className="mt-1 text-sm text-red-600">{errors.id}</p>
                )}
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
                  className={`w-full px-4 py-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-3 text-sm text-gray-700">
                  次回から自動的にログイン
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                ログイン
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

            {/* Divider */}
            <div className="mt-6 mb-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleアカウントでログイン
            </button>
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

export default UserLoginPage;