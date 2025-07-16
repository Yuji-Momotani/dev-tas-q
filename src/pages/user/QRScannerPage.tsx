import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Camera } from 'lucide-react';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setError('');
      }
    } catch (err) {
      console.error('カメラアクセスエラー:', err);
      setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleLogout = () => {
    stopCamera();
    navigate('/user/login');
  };

  const handleBack = () => {
    stopCamera();
    navigate('/user/work');
  };

  // QRコード検出のシミュレーション（実際の実装では専用ライブラリを使用）
  const simulateQRDetection = () => {
    // 実際の実装では、QRコード読み取りライブラリ（例：qr-scanner）を使用
    setTimeout(() => {
      const mockQRData = "WORK_ID_12345";
      // QRコード読み取り結果をsessionStorageに保存
      sessionStorage.setItem('qrResult', mockQRData);
      handleBack();
    }, 2000);
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
              onClick={startCamera}
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
              onLoadedMetadata={simulateQRDetection}
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
                  {isScanning && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-1 bg-green-400 opacity-80 animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                  <p className="text-white text-sm">
                    QRコードをフレーム内に合わせてください
                  </p>
                </div>
              </div>
            </div>

            {/* Dark Overlay with Cutout */}
            <div className="absolute inset-0 bg-black bg-opacity-50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-transparent border-2 border-dashed border-white border-opacity-30 rounded-lg"></div>
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
            onClick={startCamera}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
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