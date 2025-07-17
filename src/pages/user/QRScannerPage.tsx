import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Camera } from 'lucide-react';
import jsQR from 'jsqr';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const isInitializingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  useEffect(() => {
    const initializeScanner = async () => {
      await startQRScanner();
    };
    
    initializeScanner();
    return () => {
      stopQRScanner();
    };
  }, []);

  const startQRScanner = async () => {
    // 既に初期化中の場合は処理をスキップ
    if (isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      // 既存のストリームを停止
      stopQRScanner();

      if (!videoRef.current || !canvasRef.current) {
        setError('カメラ要素が見つかりません。');
        return;
      }

      // BarcodeDetectorの初期化（対応している場合）
      if ('BarcodeDetector' in window) {
        try {
          barcodeDetectorRef.current = new BarcodeDetector({
            formats: ['qr_code']
          });
        } catch (err) {
          console.warn('BarcodeDetector初期化エラー:', err);
        }
      }

      // カメラストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // videoが読み込まれるまで待機
      await new Promise<void>((resolve) => {
        const video = videoRef.current!;
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        }
      });

      // QR検出ループを開始
      startDetectionLoop();
      
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
      } else {
        setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
      }
    } finally {
      isInitializingRef.current = false;
    }
  };

  const startDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      // canvasのサイズをvideoに合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // videoフレームをcanvasに描画
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        if (barcodeDetectorRef.current) {
          // BarcodeDetectorを使用
          const barcodes = await barcodeDetectorRef.current.detect(canvas);
          if (barcodes.length > 0) {
            console.log('BarcodeDetectorでQRコード検出:', barcodes[0].rawValue);
            handleQRDetected(barcodes[0].rawValue);
            return;
          }
        }
        
        // jsQRを常に試行（BarcodeDetectorと並行して使用）
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = await simulateQRDetection(imageData);
        if (qrResult) {
          console.log('jsQRでQRコード検出:', qrResult);
          handleQRDetected(qrResult);
          return;
        }
      } catch (err) {
        console.warn('QR検出エラー:', err);
      }

      // 次のフレームを処理（検出頻度を上げる）
      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const simulateQRDetection = async (imageData: ImageData): Promise<string | null> => {
    try {
      // jsQRライブラリを使用してQRコードを検出
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        return code.data;
      }
    } catch (err) {
      console.warn('jsQR検出エラー:', err);
    }
    return null;
  };

  const stopQRScanner = () => {
    isInitializingRef.current = false;
    
    // アニメーションフレームをキャンセル
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    
    // メディアストリームを停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // video要素をクリア
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    
    // モックデータを設定
    const mockData = {
      company: '株式会社 音光堂',
      task: 'Aハンダ作業開始',
      qrCode: qrData,
      timestamp: new Date().toISOString()
    };
    
    // QRコード読み取り結果をsessionStorageに保存
    sessionStorage.setItem('qrResult', JSON.stringify(mockData));
    
    // 少し遅延を入れてフィードバックを表示
    setTimeout(() => {
      handleBack();
    }, 500);
  };

  const handleRetry = () => {
    setError('');
    startQRScanner();
  };

  // テスト用：QRコード検出をシミュレート
  const handleTestQRDetection = () => {
    handleQRDetected('TEST_QR_CODE_' + Date.now());
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
            
            {/* Hidden Canvas for QR Detection */}
            <canvas
              ref={canvasRef}
              className="hidden"
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
                  {/* Test button for QR detection */}
                  <button
                    onClick={handleTestQRDetection}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors"
                  >
                    テスト検出
                  </button>
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