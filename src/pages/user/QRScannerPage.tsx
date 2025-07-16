import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Camera } from 'lucide-react';
import QrScanner from 'qr-scanner';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  useEffect(() => {
    startQRScanner();
    return () => {
      stopQRScanner();
    };
  }, []);

  const startQRScanner = async () => {
    try {
      // 既存のQrScannerインスタンスがある場合は停止・破棄
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      if (!videoRef.current) return;

      // QrScannerインスタンスを作成
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleQRDetected(result.data),
        {
          onDecodeError: (err) => {
            // QRコードが見つからない場合のエラーは無視
            // console.log('QR decode error:', err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // 背面カメラを優先
        }
      );

      qrScannerRef.current = qrScanner;
      
      // 小さな遅延を追加してブラウザのメディア要素の初期化を待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // スキャナーを開始
      await qrScanner.start();
      setIsScanning(true);
      setIsWaitingForQR(true);
      setError('');
      
    } catch (err) {
      console.error('QRスキャナー開始エラー:', err);
      setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
    }
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setIsWaitingForQR(false);
  };

  const handleLogout = () => {
    stopQRScanner();
    navigate('/user/login');
  };

  const handleBack = () => {
    stopQRScanner();
    navigate('/user/work');
  };

  // QRコード読み取り成功時の処理
  const handleQRDetected = (qrData: string) => {
    console.log('QRコード読み取り成功:', qrData);
    setIsWaitingForQR(false);
    
    // QRコード読み取り結果をsessionStorageに保存
    sessionStorage.setItem('qrResult', qrData);
    
    // 少し遅延を入れてフィードバックを表示
    setTimeout(() => {
      handleBack();
    }, 500);
  };

  const handleRetry = () => {
    setError('');
    startQRScanner();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-green-600 text-white py-4 px-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md p-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-medium">QR読取</h1>
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

      {/* Camera View */}
      <div className="relative flex-1 flex items-center justify-center">
        {error ? (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-white text-lg mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              再試行
            </button>
          </div>
        ) : (
          <>
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* QR Code Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scanning Frame */}
              <div className="relative">
                {/* QR Code Frame */}
                <div className="w-64 h-64 relative">
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
                  {isScanning && isWaitingForQR && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-1 bg-green-400 opacity-80 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                  <p className="text-white text-sm mb-2">
                    {isWaitingForQR ? 'QRコードをフレーム内に合わせてください' : 'QRコード読み取り完了'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dark Overlay with Cutout */}
            <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 bg-transparent border-2 border-dashed rounded-lg transition-colors ${
                  isWaitingForQR ? 'border-white border-opacity-30' : 'border-green-400 border-opacity-80'
                }`}></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            disabled={!error}
          >
            <Camera className="w-5 h-5" />
            <span>再スキャン</span>
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