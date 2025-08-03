import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { linkAuthUserToAdminProfile } from '../../utils/supabaseAdmin';

const AdminAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isEmailChange, setIsEmailChange] = useState(false);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setLoading(true);
      setError('');

      // URLからSupabaseの認証セッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('セッション取得エラー:', sessionError);
        setError('認証に失敗しました。招待メールまたはパスワードリセットメールから再度アクセスしてください。');
        return;
      }

      if (!session || !session.user) {
        setError('有効な認証セッションが見つかりません。招待メールまたはパスワードリセットメールから再度アクセスしてください。');
        return;
      }

      // ユーザー情報を設定
      setUser(session.user);

      // URLパラメータから処理種別を判定
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      
      if (type === 'recovery') {
        // パスワードリセットの場合
        setIsPasswordReset(true);
      } else if (type === 'email_change') {
        // メールアドレス変更確認の場合
        setIsEmailChange(true);
        // メールアドレス変更の場合はパスワード入力不要のため、すぐに処理完了
        handleEmailChangeConfirmation();
        return;
      } else {
        // 招待メールの場合（管理者の場合は基本的にパスワードリセットのみ）
        setIsPasswordReset(false);
      }

    } catch (err) {
      console.error('認証コールバック処理エラー:', err);
      setError('認証処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeConfirmation = async () => {
    try {
      // メールアドレス変更は既にSupabase側で処理されているため、
      // データベーストリガーによってadminsテーブルも自動更新される
      
      alert('メールアドレスの変更が完了しました。\n新しいメールアドレスでログインできます。');
      
      // ログアウトして管理者ログイン画面にリダイレクト
      await supabase.auth.signOut();
      navigate('/admin/login');
      
    } catch (err) {
      console.error('メールアドレス変更確認エラー:', err);
      setError('メールアドレス変更の確認中にエラーが発生しました。');
    }
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
      return 'パスワードは大文字、小文字、数字を含む必要があります';
    }
    return '';
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // パスワード検証
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return;
    }

    try {
      setSaving(true);
      setPasswordError('');

      // パスワードを更新
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('パスワード更新エラー:', error);
        setPasswordError('パスワードの更新に失敗しました。再度お試しください。');
        return;
      }

      // 新規招待の場合、adminsテーブルにauth_user_idを関連付け
      if (!isPasswordReset && user) {
        try {
          const linkResult = await linkAuthUserToAdminProfile(user.id, user.email);
          if (!linkResult.success) {
            console.error('管理者プロフィール関連付けエラー:', linkResult.error);
            setPasswordError('アカウントの関連付けに失敗しました。管理者にお問い合わせください。');
            return;
          }
        } catch (linkErr) {
          console.error('管理者プロフィール関連付け例外:', linkErr);
          setPasswordError('アカウントの関連付けに失敗しました。管理者にお問い合わせください。');
          return;
        }
      }

      if (isPasswordReset) {
        alert('パスワードが正常に変更されました。\n管理者ログイン画面に移動します。');
      } else {
        alert('パスワードが正常に設定されました。\n管理者ログイン画面に移動します。');
      }
      
      // ログアウトして管理者ログイン画面にリダイレクト
      await supabase.auth.signOut();
      navigate('/admin/login');

    } catch (err) {
      console.error('パスワード変更エラー:', err);
      setPasswordError('パスワード変更中にエラーが発生しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証エラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            管理者ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">パスワード変更</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isPasswordReset ? '管理者パスワード変更' : '管理者パスワード設定'}
            </h1>
            <p className="text-gray-600">
              {isPasswordReset ? (
                <>
                  パスワードをリセットします。<br />
                  新しいパスワードを設定してください。
                </>
              ) : (
                <>
                  管理者アカウントが作成されました。<br />
                  ログイン用のパスワードを設定してください。
                </>
              )}
            </p>
            {user && (
              <p className="text-sm text-gray-500 mt-2">
                アカウント: {user.email}
              </p>
            )}
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="8文字以上（大文字・小文字・数字を含む）"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="上記と同じパスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {passwordError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {passwordError}
              </div>
            )}

            {/* パスワード要件 */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">パスワード要件:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>8文字以上</li>
                <li>大文字を含む（A-Z）</li>
                <li>小文字を含む（a-z）</li>
                <li>数字を含む（0-9）</li>
              </ul>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              <span>{saving ? 'パスワード変更中...' : 'パスワードを変更'}</span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
            >
              管理者ログイン画面に戻る
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default AdminAuthCallbackPage;