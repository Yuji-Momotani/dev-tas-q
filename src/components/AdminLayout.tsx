import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const logoPath = new URL("../assets/logo.png", import.meta.url).href;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate('/admin/login');
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('認証チェックエラー:', error);
      navigate('/admin/login');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      navigate('/admin/login');
    }
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideoList = () => {
    navigate('/admin/work-videos');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleWorkerList = () => {
    navigate('/admin/worker-list');
  };

  const handleWorkMaster = () => {
    navigate('/admin/work-master');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">認証中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-1 w-8">
            <img 
              src={logoPath}
              alt="ロゴ"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-lg font-medium">{title}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleLogout}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            ログアウト
          </button>
        </div>
      </header>
      
      <div className="p-4">
        {/* Navigation buttons */}
        <div className="mb-4 flex space-x-2">
          <button 
            onClick={handleWorkList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業状況一覧
          </button>
          <button 
            onClick={handleWorkerList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業者一覧
          </button>
          <button 
            onClick={handleAccountManagement}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            アカウント管理
          </button>
          <button 
            onClick={handleWorkVideoList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
          <button 
            onClick={handleWorkMaster}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            料金マスタ管理
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AdminLayout;