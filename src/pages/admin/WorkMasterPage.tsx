import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../utils/supabase';
import type { Database } from '../../types/database.types';
import { handleSupabaseError } from '../../utils/auth';
import { Plus, Edit2, Trash2 } from 'lucide-react';

type MWork = Database['public']['Tables']['m_work']['Row'];

const WorkMasterPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状態管理
  const [workMasters, setWorkMasters] = useState<MWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<MWork | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    default_unit_price: ''
  });

  const checkAuthentication = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/admin/login');
        return;
      }
      fetchWorkMasters();
    } catch (err) {
      console.error('認証チェックエラー:', err);
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchWorkMasters = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('m_work')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, navigate, 'admin');
        return;
      }

      setWorkMasters(data || []);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('料金マスタデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleOpenModal = (work?: MWork) => {
    if (work) {
      setEditingWork(work);
      setFormData({
        title: work.title,
        default_unit_price: work.default_unit_price.toString()
      });
    } else {
      setEditingWork(null);
      setFormData({
        title: '',
        default_unit_price: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWork(null);
    setFormData({
      title: '',
      default_unit_price: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('作業名を入力してください');
      return;
    }
    
    const unitPrice = parseInt(formData.default_unit_price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      alert('有効な単価を入力してください');
      return;
    }

    try {
      setLoading(true);
      
      if (editingWork) {
        // 更新
        const { error } = await supabase
          .from('m_work')
          .update({
            title: formData.title.trim(),
            default_unit_price: unitPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingWork.id);
          
        if (error) {
          handleSupabaseError(error, navigate, 'admin');
          return;
        }
        
        alert('料金マスタを更新しました');
      } else {
        // 新規作成
        const { error } = await supabase
          .from('m_work')
          .insert({
            title: formData.title.trim(),
            default_unit_price: unitPrice
          });
          
        if (error) {
          handleSupabaseError(error, navigate, 'admin');
          return;
        }
        
        alert('料金マスタを追加しました');
      }
      
      handleCloseModal();
      fetchWorkMasters();
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (work: MWork) => {
    if (!confirm(`料金マスタ「${work.title}」を削除しますか？\n※この料金マスタを使用している作業がある場合は削除できません。`)) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('m_work')
        .delete()
        .eq('id', work.id);
        
      if (error) {
        if (error.code === '23503') {
          alert('この料金マスタを使用している作業があるため削除できません');
        } else {
          handleSupabaseError(error, navigate, 'admin');
        }
        return;
      }
      
      alert('料金マスタを削除しました');
      fetchWorkMasters();
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="料金マスタ管理">
      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-md shadow-sm p-4 mb-6">
        {/* ヘッダー */}
        <div className="flex justify-left items-center mb-4">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            disabled={loading}
          >
            <Plus size={16} />
            <span>料金マスタ追加</span>
          </button>
        </div>
        
        {/* テーブル */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          ) : (
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    ID
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作業名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    単価
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作成日時
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 w-32">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {workMasters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      料金マスタが登録されていません
                    </td>
                  </tr>
                ) : (
                  workMasters.map((work) => (
                    <tr key={work.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        #{work.id}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        {work.title}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        ¥{work.default_unit_price.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                        {new Date(work.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(work)}
                            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="編集"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(work)}
                            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">
              {editingWork ? '料金マスタ編集' : '料金マスタ追加'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作業名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="作業名を入力"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  単価 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.default_unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_unit_price: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? '保存中...' : (editingWork ? '更新' : '追加')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </AdminLayout>
  );
};

export default WorkMasterPage;