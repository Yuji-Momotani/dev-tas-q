import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="bg-gray-200 rounded-md p-2">
          <span className="text-gray-600">⋮</span>
        </div>
        <h1 className="text-lg font-medium text-gray-800">{title}</h1>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleLogin}
          className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          ログイン
        </button>
        <button
          onClick={onLogout}
          className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
};

export default Header;