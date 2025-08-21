import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';

type Admin = Database['public']['Tables']['admins']['Row'];

const EmailChangePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [oldEmail, setOldEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
        .select('*')
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

      setAdmin(data);
      setOldEmail(data.email || '');
    } catch (err) {
      console.error('管理者詳細取得処理エラー:', err);
      setError('管理者情報の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!oldEmail.trim()) {
      setError('現在のメールアドレスを入力してください');
      return;
    }

    if (!newEmail.trim()) {
      setError('新しいメールアドレスを入力してください');
      return;
    }

    if (!validateEmail(oldEmail)) {
      setError('現在のメールアドレスが有効な形式ではありません');
      return;
    }

    if (!validateEmail(newEmail)) {
      setError('新しいメールアドレスが有効な形式ではありません');
      return;
    }

    if (oldEmail === newEmail) {
      setError('現在のメールアドレスと新しいメールアドレスが同じです');
      return;
    }

    // 現在のメールアドレスが管理者のメールアドレスと一致するか確認
    if (admin && oldEmail !== admin.email) {
      setError('現在のメールアドレスが正しくありません');
      return;
    }

    try {
      setSaving(true);

      // 認証セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        alert('認証セッションが無効です。再度ログインしてください。');
        navigate('/admin/login');
        return;
      }

      // 新しいメールアドレスが既に他の管理者で使用されていないか確認
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admins')
        .select('id')
        .eq('email', newEmail)
        .is('deleted_at', null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('メールアドレス重複チェックエラー:', checkError);
        setError('メールアドレスの重複チェックに失敗しました');
        return;
      }

      if (existingAdmin) {
        setError('この新しいメールアドレスは既に他の管理者で使用されています');
        return;
      }

      // Supabase Authのメールアドレス変更を実行
      // これにより新しいメールアドレスに確認メールが送信される
      const { error: updateAuthError } = await supabase.auth.updateUser(
        { email: newEmail },
        { 
          emailRedirectTo: `${window.location.origin}/admin/auth/callback?type=email_change`
        }
      );

      if (updateAuthError) {
        console.error('Auth メールアドレス更新エラー:', updateAuthError);
        setError('メールアドレスの変更手続きに失敗しました。再度お試しください。');
        return;
      }

      // 成功アラートを表示
      alert(`メールアドレスの変更手続きを開始しました。\n\n新しいメールアドレス（${newEmail}）に確認メールを送信しました。\n\nメール内のリンクをクリックして変更を完了してください。\n\n※メールアドレスの変更が完了するまで、現在のメールアドレスでログインしてください。`);

      // アカウント詳細画面に戻る
      navigate(`/admin/account-detail/${id}`);
    } catch (err) {
      console.error('メールアドレス変更処理エラー:', err);
      setError('メールアドレスの変更中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/admin/account-detail/${id}`);
  };

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
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
            <h1 className="text-lg font-medium">メールアドレス変更</h1>
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

  if (error && !admin) {
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
            <h1 className="text-lg font-medium">メールアドレス変更</h1>
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
          <p>{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            戻る
          </button>
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
          <h1 className="text-lg font-medium">メールアドレス変更</h1>
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
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>アカウント詳細に戻る</span>
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-medium mb-2">メールアドレス変更</h2>
            <p className="text-gray-600 text-sm">
              現在のメールアドレスと新しいメールアドレスを入力してください
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailChange} className="space-y-4">
            {/* 現在のメールアドレス */}
            <div>
              <label htmlFor="oldEmail" className="block text-sm font-medium text-gray-700 mb-2">
                現在のメールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="oldEmail"
                type="email"
                value={oldEmail}
                onChange={(e) => setOldEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="current@example.com"
                required
              />
            </div>

            {/* 新しいメールアドレス */}
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                新しいメールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="new@example.com"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1 px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '変更中...' : 'メールアドレスを変更'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default EmailChangePage;