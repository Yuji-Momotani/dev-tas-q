import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

interface WorkerLayoutProps {
  title: string;
  children: React.ReactNode;
  onReady?: () => void;
}

const WorkerLayout: React.FC<WorkerLayoutProps> = ({ title, children, onReady }) => {
  const navigate = useNavigate();
  const logoPath = new URL("../assets/logo.png", import.meta.url).href;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWorkerAuth();
  }, []);

  const checkWorkerAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate('/worker/login');
        return;
      }

      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('auth_user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (workerError || !worker) {
        await supabase.auth.signOut();
        navigate('/worker/login');
        return;
      }

      setLoading(false);
      onReady?.(); // 認証完了を通知
    } catch (error) {
      console.error('認証チェックエラー:', error);
      navigate('/worker/login');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/worker/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      navigate('/worker/login');
    }
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
      </header>
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default WorkerLayout;