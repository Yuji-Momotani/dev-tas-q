import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { handleSupabaseError } from '../../utils/auth';
import AdminLayout from '../../components/AdminLayout';
import QRScannerComponent from '../../components/QRScannerComponent';
import { WorkStatus, getWorkStatusLabel } from '../../constants/workStatus';

const AdminQRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [detectedQR, setDetectedQR] = useState<string | null>(null);
  const [showLinkButton, setShowLinkButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const handleBack = () => {
    navigate('/admin/work-list');
  };

  // QRコード読み取り成功時の処理
  const handleQRDetected = (workId: string) => {
    // 検出されたQRコードを保存し、リンクボタンを表示
    setDetectedQR(workId);
    setShowLinkButton(true);
  };

  // リンクボタンクリック時の処理
  const handleLinkClick = async () => {
    if (!detectedQR) return;

    try {
      setLoading(true);
      setError('');

      const workId = parseInt(detectedQR, 10);
      
      // 作業が存在するか確認
      const { data: workData, error: checkError } = await supabase
        .from('works')
        .select('id, status')
        .eq('id', workId)
        .is('deleted_at', null)
        .single();

      if (checkError || !workData) {
        try {
          handleSupabaseError(checkError, navigate, 'admin');
        } catch {
          setError('作業情報が見つかりません');
          return;
        }
        return;
      }

      // ステータスチェック - 配送中(4), 集荷依頼中(5), 持込待ち(6)のみ受付
      const allowedStatuses = [
        WorkStatus.IN_DELIVERY,
        WorkStatus.PICKUP_REQUESTING,
        WorkStatus.WAITING_DROPOFF
      ];

      if (!allowedStatuses.includes(workData.status as WorkStatus)) {
        const currentStatusLabel = getWorkStatusLabel(workData.status as WorkStatus);
        setError(`この作業は完了処理できません。現在のステータス: ${currentStatusLabel}\n（配送中、集荷依頼中、持込待ちのみ処理可能）`);
        return;
      }

      // 作業を完了（status=7）に更新
      // JST時間を取得
      const now = new Date();
      const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9時間
      
      const { error: updateError } = await supabase
        .from('works')
        .update({ 
          status: WorkStatus.COMPLETED,
          ended_at: jstTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workId);

      if (updateError) {
        console.error('作業ステータス更新エラー:', updateError);
        try {
          handleSupabaseError(updateError, navigate, 'admin');
        } catch {
          setError('作業の完了処理に失敗しました');
          return;
        }
      }

      // 成功メッセージ表示
      alert('作業を完了しました');
      
      // 作業状況一覧画面に戻る
      navigate('/admin/work-list');
      
    } catch (err) {
      console.error('作業完了エラー:', err);
      setError('処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="QR読取" onReady={() => setIsLayoutReady(true)}>
      {!showLinkButton ? (
        <QRScannerComponent
          onQRDetected={handleQRDetected}
          onBack={handleBack}
          isReady={isLayoutReady}
        />
      ) : (
        <div className="relative bg-black overflow-hidden -m-4" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-xl mb-8">QRコードが検出されました</p>
              <button
                onClick={handleLinkClick}
                disabled={loading}
                className="bg-yellow-400 text-black px-6 py-3 rounded-full font-medium shadow-lg hover:bg-yellow-300 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <span>✅</span>
                <span>{loading ? '処理中...' : '作業を完了'}</span>
              </button>
              
              {/* Control Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowLinkButton(false);
                    setDetectedQR(null);
                    setError('');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  再読み取り
                </button>
                <button
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  戻る
                </button>
              </div>
              
              {error && (
                <div className="mt-8 bg-red-600 text-white px-4 py-2 rounded-lg max-w-md mx-auto text-center whitespace-pre-line">
                  {error}
                </div>
              )}
            </div>
          </div>


          {/* Footer */}
          <footer className="absolute bottom-4 right-4">
            <p className="text-xs text-gray-400">©️〇〇〇〇会社</p>
          </footer>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminQRScannerPage;