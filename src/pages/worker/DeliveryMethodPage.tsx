import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Truck, Mail, Package } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const DeliveryMethodPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentWorkId, setCurrentWorkId] = useState<number | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/worker/login');
  };

  // 現在の作業を取得
  useEffect(() => {
    const fetchCurrentWork = async () => {
      try {
        // 現在のユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/worker/login');
          return;
        }

        // 作業者情報を取得
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .eq('auth_user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (workerError || !workerData) {
          setError('作業者情報が見つかりません');
          return;
        }

        // 着手中の作業を取得
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select('id')
          .eq('worker_id', workerData.id)
          .eq('status', 3)
          .is('deleted_at', null)
          .limit(1);

        if (workError) {
          console.error('作業データ取得エラー:', workError);
          setError('作業データの取得に失敗しました');
          return;
        }

        if (workData && workData.length > 0) {
          setCurrentWorkId(workData[0].id);
        } else {
          // 着手中の作業がない場合は作業画面に戻る
          navigate('/worker/work');
        }
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      }
    };

    fetchCurrentWork();
  }, [navigate]);

  const handleDeliveryMethod = async (method: string) => {
    if (!currentWorkId) {
      setError('作業IDが見つかりません');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 作業ステータスを完了(4)に更新
      const { error: updateError } = await supabase
        .from('works')
        .update({ 
          status: 4,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentWorkId);

      if (updateError) {
        console.error('作業ステータス更新エラー:', updateError);
        setError('作業完了の処理に失敗しました');
        return;
      }

      // 成功メッセージ表示
      alert(`配送方法「${method}」を選択しました。\n作業が完了しました。`);
      
      // 作業画面に戻る
      navigate('/worker/work');
      
    } catch (err) {
      console.error('配送方法選択エラー:', err);
      setError('処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-medium">配送方法選択</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 border border-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            配送方法を選択してください
          </h2>
          
          <div className="space-y-4 max-w-md mx-auto">
            {/* 持ち込み */}
            <button
              onClick={() => handleDeliveryMethod('持ち込み')}
              disabled={loading || !currentWorkId}
              className="w-full bg-blue-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-8 h-8" />
              <span>{loading ? '処理中...' : '持ち込み'}</span>
            </button>

            {/* 郵送 */}
            <button
              onClick={() => handleDeliveryMethod('郵送')}
              disabled={loading || !currentWorkId}
              className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-8 h-8" />
              <span>{loading ? '処理中...' : '郵送'}</span>
            </button>

            {/* 集荷 */}
            <button
              onClick={() => handleDeliveryMethod('集荷')}
              disabled={loading || !currentWorkId}
              className="w-full bg-orange-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Truck className="w-8 h-8" />
              <span>{loading ? '処理中...' : '集荷'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-right">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default DeliveryMethodPage;