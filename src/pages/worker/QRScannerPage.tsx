import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { supabase } from '../../utils/supabase';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const isInitializingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);
  const [detectedQR, setDetectedQR] = useState<string | null>(null);
  const [showLinkButton, setShowLinkButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWorkerId, setCurrentWorkerId] = useState<number | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      // 二重初期化を防ぐ
      if (isInitializingRef.current) return;
      
      // 作業者情報を取得
      await fetchWorkerInfo();
      await startQRScanner();
    };
    
    initializeScanner();
    return () => {
      stopQRScanner();
    };
  }, []);

  // 作業者情報を取得
  const fetchWorkerInfo = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/worker/login');
        return;
      }

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

      setCurrentWorkerId(workerData.id);
    } catch (err) {
      console.error('作業者情報取得エラー:', err);
      setError('作業者情報の取得に失敗しました');
    }
  };

  const startQRScanner = async () => {
    // 二重初期化を防ぐ
    if (isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      // 既存のスキャナーを停止
      stopQRScanner();

      if (!videoRef.current) {
        setError('カメラ要素が見つかりません。');
        return;
      }

      // video要素のイベントリスナーを追加してエラーをキャッチ
      const video = videoRef.current;
      video.addEventListener('error', (e) => {
        console.warn('Video error:', e);
      });

      // QrScannerインスタンスを作成
      qrScannerRef.current = new QrScanner(
        video,
        (result) => {
          console.log('QRコード読み取り成功:', result.data);
          console.log('QRコード詳細情報:', result);
          handleQRDetected(result.data);
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5 // スキャン頻度を制限
        }
      );

      // QRスキャナーを開始（AbortErrorを無視）
      try {
        await qrScannerRef.current.start();
      } catch (startErr) {
        if (startErr instanceof Error && startErr.name === 'AbortError') {
          console.warn('Video play interrupted, but continuing...', startErr.message);
          // AbortErrorは無視して続行
        } else {
          throw startErr;
        }
      }
      
      setIsScanning(true);
      setIsWaitingForQR(true);
      setError('');
      
    } catch (err) {
      console.error('QRスキャナー開始エラー:', err);
      setIsScanning(false);
      setIsWaitingForQR(false);
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('カメラの使用が許可されていません。ブラウザの設定を確認してください。');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('カメラが見つかりません。');
      } else if (err instanceof Error && err.name === 'AbortError') {
        setError(''); // AbortErrorの場合はエラー表示しない
      } else {
        setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
      }
    } finally {
      isInitializingRef.current = false;
    }
  };


  const stopQRScanner = () => {
    isInitializingRef.current = false;
    
    // QrScannerインスタンスを停止・破棄
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (err) {
        console.warn('QrScanner停止エラー（無視）:', err);
      }
      qrScannerRef.current = null;
    }
    
    setIsScanning(false);
    setIsWaitingForQR(false);
  };

  const handleLogout = async () => {
    stopQRScanner();
    await supabase.auth.signOut();
    navigate('/worker/login');
  };

  const handleBack = () => {
    stopQRScanner();
    navigate('/worker/work');
  };

  // QRコード読み取り成功時の処理
  const handleQRDetected = (qrData: string) => {
    console.log('QRコード読み取り成功:', qrData);
    console.log('QRコードの内容をデバッグ出力:', JSON.stringify(qrData));
    
    // QRコードから作業IDを抽出
    // 期待される形式: "workerid:1,workid:#123" または "workerid:1,workid:123"
    const workIdMatch = qrData.match(/workid:(?:#)?([0-9]+)/i);
    
    if (!workIdMatch || !workIdMatch[1]) {
      setError('無効なQRコードです');
      // スキャナーを再開
      setTimeout(() => {
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
        setError('');
      }, 3000);
      return;
    }
    
    // 検出されたQRコードを保存し、リンクボタンを表示
    setDetectedQR(workIdMatch[1]);
    setShowLinkButton(true);
    setIsWaitingForQR(false);
    
    // スキャナーを一時停止（連続検出を防ぐ）
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
  };

  // リンクボタンクリック時の処理
  const handleLinkClick = async () => {
    if (!detectedQR || !currentWorkerId) return;

    try {
      setLoading(true);
      setError('');

      const workId = parseInt(detectedQR, 10);
      
      // 作業が存在するか確認
      const { data: workData, error: checkError } = await supabase
        .from('works')
        .select('id, status, worker_id')
        .eq('id', workId)
        .is('deleted_at', null)
        .single();

      if (checkError || !workData) {
        setError('作業情報が見つかりません');
        return;
      }

      // ステータスチェック
      if (workData.status === 4) {
        setError('この作業は既に完了しています');
        return;
      }

      if (workData.status === 3 && workData.worker_id !== currentWorkerId) {
        setError('この作業は他の作業者が着手中です');
        return;
      }

      // 作業を着手中（status=3）に更新し、作業者をアサイン
      const { error: updateError } = await supabase
        .from('works')
        .update({ 
          status: 3,
          worker_id: currentWorkerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', workId);

      if (updateError) {
        console.error('作業ステータス更新エラー:', updateError);
        setError('作業の開始に失敗しました');
        return;
      }

      // 成功メッセージ表示
      alert('作業を開始しました');
      
      // 作業画面に遷移
      navigate('/worker/work');
      
    } catch (err) {
      console.error('作業開始エラー:', err);
      setError('処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen bg-black overflow-hidden">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-medium">QR読取</h1>
          </div>
          {/* <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 border border-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button> */}
        </div>
      </header>

      {/* Camera View */}
      <div className="relative h-full flex items-center justify-center">
        {error && !isScanning ? (
          <div className="text-center p-8">
            <p className="text-white text-lg mb-4">{error}</p>
          </div>
        ) : (
          <>
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* QR Code Scanning Overlay */}
            <div className="absolute inset-0 flex justify-center" style={{alignItems: 'flex-start', paddingTop: '20vh'}}>
              {/* Scanning Frame */}
              <div className="relative">
                {/* QR Code Frame */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 relative">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white"></div>
                  
                  {/* Center Target */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-pink-500 rounded-full bg-pink-500 opacity-80"></div>
                  </div>

                  {/* Scanning Animation */}
                  {isScanning && isWaitingForQR && !showLinkButton && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-1 bg-green-400 opacity-80 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center w-full">
                  <p className="text-white text-sm mb-3">
                    {showLinkButton ? 'QRコードが検出されました' : 'QRコードをフレーム内に合わせてください'}
                  </p>
                </div>

                {/* Link Button (iPhone style) */}
                {showLinkButton && (
                  <div className="absolute top-full mt-16 left-1/2 transform -translate-x-1/2 w-full flex justify-center">
                    <button
                      onClick={handleLinkClick}
                      disabled={loading}
                      className="bg-yellow-400 text-black px-6 py-3 rounded-full font-medium shadow-lg hover:bg-yellow-300 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>🔗</span>
                      <span>{loading ? '処理中...' : '作業を開始'}</span>
                    </button>
                  </div>
                )}

                {/* エラーメッセージ */}
                {error && isScanning && (
                  <div className="absolute top-full mt-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg max-w-xs text-center">
                    {error}
                  </div>
                )}

              </div>
            </div>

            {/* Dark Overlay with Cutout */}
            <div className="absolute inset-0 bg-black bg-opacity-0 pointer-events-none">
              <div className="absolute inset-0 flex justify-center" style={{alignItems: 'flex-start', paddingTop: '20vh'}}>
                <div className={`w-56 h-56 sm:w-64 sm:h-64 bg-transparent border-2 border-dashed rounded-lg transition-colors ${
                  isWaitingForQR ? 'border-white border-opacity-30' : 'border-green-400 border-opacity-80'
                }`}></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 right-4">
        <p className="text-xs text-gray-400">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default QRScannerPage;