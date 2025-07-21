import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Truck, Mail, Package } from 'lucide-react';

const DeliveryMethodPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/user/login');
  };

  const handleDeliveryMethod = (method: string) => {
    alert(`${method}を選択しました。`);
    // TODO: 配送方法の処理を実装
    // 一旦作業画面に戻る
    navigate('/user/work');
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            配送方法を選択してください
          </h2>
          
          <div className="space-y-4 max-w-md mx-auto">
            {/* 持ち込み */}
            <button
              onClick={() => handleDeliveryMethod('持ち込み')}
              className="w-full bg-blue-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
            >
              <Package className="w-8 h-8" />
              <span>持ち込み</span>
            </button>

            {/* 郵送 */}
            <button
              onClick={() => handleDeliveryMethod('郵送')}
              className="w-full bg-green-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
            >
              <Mail className="w-8 h-8" />
              <span>郵送</span>
            </button>

            {/* 集荷 */}
            <button
              onClick={() => handleDeliveryMethod('集荷')}
              className="w-full bg-orange-600 text-white py-6 px-6 rounded-lg font-medium text-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-4"
            >
              <Truck className="w-8 h-8" />
              <span>集荷</span>
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