import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, QrCode, LogOut } from 'lucide-react';
import { getUserWorkItems, hasActiveWork, setUserWorkFromQR } from '../../data/userMockData';
import { UserWorkItem } from '../../types/user';

const UserWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = useState('test@example.com'); // 実際の実装では認証状態から取得
  const [workItems, setWorkItems] = useState<UserWorkItem[]>([]);
  const [hasWork, setHasWork] = useState(false);

  // QRコード読み取り結果を受け取る処理
  useEffect(() => {
    const qrResult = sessionStorage.getItem('qrResult');
    if (qrResult) {
      setUserWorkFromQR(currentUser, qrResult);
      sessionStorage.removeItem('qrResult');
    }
  }, [currentUser]);

  useEffect(() => {
    // ユーザーの作業データを取得
    const userWork = getUserWorkItems(currentUser);
    setWorkItems(userWork);
    setHasWork(hasActiveWork(currentUser));
  }, [currentUser]);

  // データの再読み込み関数
  const refreshWorkData = () => {
    const userWork = getUserWorkItems(currentUser);
    setWorkItems(userWork);
    setHasWork(hasActiveWork(currentUser));
  };

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
  useEffect(() => {
    refreshWorkData();
  }, []);

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {hasWork ? (
            // 作業がある場合の表示
            <div>
              {workItems.map((work) => (
                <div key={work.id} className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    {work.companyName}
                  </h2>
                  <div className="flex items-center space-x-4 mb-6">
                    <h3 className="text-2xl font-semibold text-gray-700">
                      {work.workName}
                    </h3>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium text-white ${getStatusColor(work.status)}`}>
                      {getStatusText(work.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 作業がない場合の表示
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                作業待機中
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                以下の「QRコード読み取り」ボタンを押し、段ボールに記載のQRコードを読み取ってください。
              </p>
            </div>
          )}

          {/* QR Code Button */}
          <div className="mt-12">
            <button
              onClick={handleQRCodeScan}
              className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
            >
              <QrCode className="w-8 h-8" />
              <span>QRコード読み取り</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 right-0 p-4">
        <p className="text-xs text-gray-500">©️〇〇〇〇会社</p>
      </footer>
    </div>
  );
};

export default UserWorkPage;