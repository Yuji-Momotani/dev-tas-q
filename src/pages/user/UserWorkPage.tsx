import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, QrCode, LogOut, CheckCircle } from 'lucide-react';
import { getUserWorkItems, hasActiveWork, setUserWorkFromQR, clearUserWorkData } from '../../data/userMockData';
import { UserWorkItem } from '../../types/user';

const UserWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = useState('test@example.com'); // 実際の実装では認証状態から取得
  const [workItems, setWorkItems] = useState<UserWorkItem[]>([]);
  const [hasWork, setHasWork] = useState<any>(null);

  // QRコード読み取り結果を受け取る処理
  useEffect(() => {
    const qrResult = sessionStorage.getItem('qrResult');
    if (qrResult) {
      try {
        const parsedResult = JSON.parse(qrResult);
        setHasWork(parsedResult);
        setUserWorkFromQR(currentUser, qrResult);
        sessionStorage.removeItem('qrResult');
      } catch (error) {
        console.error('QRコード結果の解析エラー:', error);
        // 旧形式のデータの場合
        setUserWorkFromQR(currentUser, qrResult);
        sessionStorage.removeItem('qrResult');
      }
    }
  }, [currentUser]);

  // useEffect(() => {
  //   // QRコード読み取り結果がない場合、作業データを初期化
  //   const qrResult = sessionStorage.getItem('qrResult');
  //   if (!qrResult) {
  //     clearUserWorkData(currentUser);
  //   }
    
  //   // ユーザーの作業データを取得
  //   const userWork = getUserWorkItems(currentUser);
  //   setWorkItems(userWork);
  //   setHasWork(hasActiveWork(currentUser));
  // }, [currentUser]);

  // // データの再読み込み関数
  // const refreshWorkData = () => {
  //   const userWork = getUserWorkItems(currentUser);
  //   setWorkItems(userWork);
  //   setHasWork(hasActiveWork(currentUser));
  // };

  const handleLogout = () => {
    navigate('/user/login');
  };

  const handleMyPage = () => {
    navigate('/user/mypage');
  };

  const handleQRCodeScan = () => {
    navigate('/user/qr-scanner');
  };

  // QRスキャナーから戻ってきた時の処理
  // useEffect(() => {
  //   refreshWorkData();
  // }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '作業着手中';
      case 'waiting':
        return '作業待機中';
      case 'completed':
        return '作業完了';
      default:
        return '';
    }
  };

  const handleCompleteWork = () => {
    // 配送方法選択画面に遷移
    navigate('/user/delivery-method');
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
            <h1 className="text-xl font-medium">作業画面</h1>
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

      {/* Navigation Buttons */}
      <div className="p-4">
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleMyPage}
            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            マイページ
          </button>
          <div className="flex-1 bg-white border-2 border-gray-300 rounded-md"></div>
        </div>

        {/* Main Content */}
        
          {hasWork ? (
            // QRコード読み取り後 or 既存の作業がある場合
            <div>
							<div className="mb-8">
								<div className="w-full bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
									<div className="text-center">
										<div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
											<svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
											</svg>
										</div>
										<p className="text-gray-600 text-sm">作業手順動画</p>
										<p className="text-gray-500 text-xs mt-1">クリックで再生</p>
									</div>
								</div>
							</div>
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
								<h2 className="text-3xl font-bold text-gray-800 mb-6">
									{hasWork.company}
								</h2>
								<div className="flex items-center space-x-4 mb-8">
									<h3 className="text-2xl font-semibold text-gray-700">
										{hasWork.task}
									</h3>
									<span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium text-white bg-red-500">
										作業着手中
									</span>
								</div>
							</div>
							{/* 作業完了ボタン */}
							<div className="mt-8">
								<button
									onClick={handleCompleteWork}
									className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-3"
								>
									<CheckCircle className="w-6 h-6" />
									<span>作業完了</span>
								</button>
							</div>
						</div>
          ) : (
            // 作業がない場合の表示（作業待機中）
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                作業待機中
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                以下の「QRコード読み取り」ボタンを押し、段ボールに記載のQRコードを読み取ってください。
              </p>
            </div>
          )}

          {/* QR Code Button - QRコード読み取り後は非表示 */}
          {!hasWork && (
            <div className="mt-12">
              <button
                onClick={handleQRCodeScan}
                className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
              >
                <QrCode className="w-8 h-8" />
                <span>QRコード読み取り</span>
              </button>
            </div>
          )}
      </div>

      {/* Footer */}
      <footer className="p-4 text-right">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default UserWorkPage;