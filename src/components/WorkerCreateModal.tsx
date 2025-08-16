import React, { useState } from 'react';
import { UserPlus, X, Save } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { inviteWorkerByEmail, supabaseAdmin } from '../utils/supabaseAdmin';

interface WorkerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface WorkerFormData {
  name: string;
  email: string;
  nextVisitDate: string;
  unitPriceRatio: number;
}

const WorkerCreateModal: React.FC<WorkerCreateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    email: '',
    nextVisitDate: '',
    unitPriceRatio: 1.0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  const handleInputChange = (field: keyof WorkerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = '作業者氏名は必須です';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 招待メールを送信してSupabase Authでユーザーを作成
      const inviteResult = await inviteWorkerByEmail(
        formData.email,
        `${window.location.origin}/worker/auth/callback`
      );

      if (!inviteResult.success) {
        console.error('招待メール送信エラー:', inviteResult.error);
        alert('招待メールの送信に失敗しました。');
        return;
      }

      // 招待されたユーザーのauth_user_idを取得
      let authUserId = null;
      if (inviteResult.user && inviteResult.user.id) {
        authUserId = inviteResult.user.id;
      }

      const workerData = {
        name: formData.name,
        email: formData.email,
        next_visit_date: formData.nextVisitDate || null,
        unit_price_ratio: formData.unitPriceRatio || null,
        auth_user_id: authUserId,
      };

      const { error } = await supabase
        .from('workers')
        .insert([workerData]);

      if (error) {
        // ユーザーテーブル登録失敗時は、作成されたAuthユーザーを削除
				// (Supabase AuthとPostgreSQLテーブル間ではクロストランザクションできないため)
        if (authUserId) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            alert('作業者の作成に失敗しました。\n招待メールは送信されましたが、システムエラーのため取り消されました。');
          } catch (deleteError) {
            console.error('Auth ユーザー削除に失敗:', deleteError);
            alert(`作業者の作成に失敗しました。\n\n重要：管理者に以下の情報を連絡してください。\n- Supabase Authに残存するユーザー メールアドレス: ${formData.email}\n\n手動でSupabase Authからユーザーを削除する必要があります。`);
          }
        } else {
          alert('作業者の作成に失敗しました。');
        }

        if (error.message.includes('JWT') || 
            error.message.includes('unauthorized') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.code === 'PGRST301') {
          alert('セッションが期限切れです。再度ログインしてください。');
          return;
        }
        return; // エラー時は処理を終了
      }

      alert('作業者が正常に作成され、招待メールを送信しました。\n作業者にメールを確認してもらい、パスワードを設定してもらってください。');

      onSave(); // 親コンポーネントのデータ再取得をトリガー
      handleClose();
    } catch (err) {
      console.error('作業者作成エラー:', err);
      alert('作業者の作成に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      nextVisitDate: '',
      unitPriceRatio: 1.0,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            作業者作成
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6">
          {/* 作業者氏名 */}
          <div className="mb-4">
            <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 mb-2">
              作業者氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="workerName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="作業者氏名を入力してください"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* メールアドレス */}
          <div className="mb-4">
            <label htmlFor="workerEmail" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="workerEmail"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="example@example.com"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>


          {/* 次回来社日 */}
          <div className="mb-4">
            <label htmlFor="workerNextVisit" className="block text-sm font-medium text-gray-700 mb-2">
              次回来社日
            </label>
            <input
              type="date"
              id="workerNextVisit"
              value={formData.nextVisitDate}
              onChange={(e) => handleInputChange('nextVisitDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* 単価率 */}
          <div className="mb-4">
            <label htmlFor="workerUnitPriceRatio" className="block text-sm font-medium text-gray-700 mb-2">
              単価率
            </label>
            <input
              type="number"
              id="workerUnitPriceRatio"
              value={formData.unitPriceRatio.toFixed(1)}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 999.9) {
                  handleInputChange('unitPriceRatio', Math.round(value * 10) / 10);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="1.0"
              min="0"
              max="999.9"
              step="0.1"
            />
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
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '作成中...' : '作成'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerCreateModal;