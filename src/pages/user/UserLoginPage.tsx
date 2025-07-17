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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">タスQ ログイン</h2>
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