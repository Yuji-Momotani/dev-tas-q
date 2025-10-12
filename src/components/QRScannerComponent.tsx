import React, { useState, useEffect, useRef, useCallback } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerComponentProps {
  onQRDetected: (workId: string) => void;
  onBack: () => void;
  isReady?: boolean;
}

const QRScannerComponent: React.FC<QRScannerComponentProps> = ({ 
  onQRDetected,
  onBack,
  isReady = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const isInitializingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  const stopQRScanner = useCallback(() => {
    console.log('stopQRScanner called, current state:', {
      isInitializing: isInitializingRef.current,
      hasScanner: !!qrScannerRef.current
    });
    
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        console.log('QrScanner stopped and destroyed');
      } catch (err) {
        console.warn('QrScanner停止エラー（無視）:', err);
      }
      qrScannerRef.current = null;
    }
    
    // isInitializingRefをリセットするタイミングを調整
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 50);
    
    setIsScanning(false);
    setIsWaitingForQR(false);
  }, []);

  const handleQRDetected = useCallback((qrData: string) => {
    console.log('QRコード読み取り成功:', qrData);
    console.log('QRコードの内容をデバッグ出力:', JSON.stringify(qrData));
    
    // QRコードから作業IDを抽出
    const workIdMatch = qrData.match(/workid:(?:#)?([0-9]+)/i);
    
    if (!workIdMatch || !workIdMatch[1]) {
      setError('無効なQRコードです');
      setTimeout(() => {
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
        setError('');
      }, 3000);
      return;
    }
    
    // スキャナーを一時停止
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    
    // 親コンポーネントにコールバック
    onQRDetected(workIdMatch[1]);
  }, [onQRDetected]);

  const startQRScanner = useCallback(async () => {
    console.log('startQRScanner called');
    if (isInitializingRef.current) {
      console.log('Already initializing, returning early');
      return;
    }
    
    isInitializingRef.current = true;
    console.log('Setting isInitializingRef to true');
    
    try {
      stopQRScanner();

      if (!videoRef.current) {
        console.error('Video element not found');
        setError('カメラ要素が見つかりません。');
        return;
      }
      
      console.log('Video element found:', videoRef.current);

      // ブラウザのメディアアクセス機能をチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported');
        setError('このブラウザではカメラアクセスがサポートされていません。');
        return;
      }

      // HTTPS接続をチェック
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      console.log('Connection is secure:', isSecure, 'Protocol:', location.protocol);
      
      if (!isSecure) {
        console.warn('Non-HTTPS connection detected. Camera access may be restricted.');
      }

      const video = videoRef.current;
      video.addEventListener('error', (e) => {
        console.warn('Video error:', e);
      });

      console.log('Creating QrScanner instance...');
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
          maxScansPerSecond: 5
        }
      );
      console.log('QrScanner instance created successfully');

      try {
        console.log('Starting QrScanner...');
        await qrScannerRef.current.start();
        console.log('QrScanner started successfully');
      } catch (startErr) {
        if (startErr instanceof Error && startErr.name === 'AbortError') {
          console.warn('Video play interrupted, but continuing...', startErr.message);
        } else {
          console.error('QrScanner start error:', startErr);
          throw startErr;
        }
      }
      
      console.log('Setting scanning states...');
      setIsScanning(true);
      setIsWaitingForQR(true);
      setError('');
      console.log('QrScanner initialization completed successfully');
      
    } catch (err) {
      console.error('QRスキャナー開始エラー:', err);
      setIsScanning(false);
      setIsWaitingForQR(false);
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('カメラの使用が許可されていません。ブラウザの設定を確認してください。');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('カメラが見つかりません。');
      } else if (err instanceof Error && err.name === 'AbortError') {
        setError('');
      } else {
        setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [handleQRDetected, stopQRScanner]);

  useEffect(() => {
    console.log('QRScannerComponent useEffect triggered, isReady:', isReady);
    if (!isReady) return;
    
    // Strict Modeでの二重実行を防ぐため、少し遅延を追加
    const timeoutId = setTimeout(async () => {
      if (isInitializingRef.current) {
        console.log('QRScanner already initializing, skipping...');
        return;
      }
      console.log('Starting QRScanner initialization...');
      await startQRScanner();
    }, 100);
    
    return () => {
      console.log('QRScannerComponent cleanup, stopping scanner...');
      clearTimeout(timeoutId);
      stopQRScanner();
    };
  }, [isReady, startQRScanner, stopQRScanner]);

  return (
    <div className="relative bg-black overflow-hidden -m-4 mt-4" style={{ height: 'calc(100vh - 120px)' }}>
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
                {isScanning && isWaitingForQR && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="w-full h-1 bg-green-400 opacity-80 animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center w-full">
                <p className="text-white text-sm mb-3">
                  QRコードをフレーム内に合わせてください
                </p>
                {/* Back Button */}
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  戻る
                </button>
              </div>

              {/* エラーメッセージ */}
              {error && isScanning && (
                <div className="absolute top-full mt-28 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg max-w-xs text-center">
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


      {/* Footer */}
      <footer className="absolute bottom-4 right-4">
        <p className="text-xs text-gray-400">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default QRScannerComponent;