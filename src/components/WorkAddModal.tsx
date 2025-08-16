import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Database } from '../types/database.types';
import { WorkStatus } from '../constants/workStatus';

type Worker = Database['public']['Tables']['workers']['Row'];

interface WorkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const WorkAddModal: React.FC<WorkAddModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 0, // 0: 未選択, 1: 依頼予定, 2: 依頼中, 3: 進行中, 4: 配送中, 5: 集荷依頼中, 6: 持込待ち, 7: 完了
    assignee: '',
    assigneeId: null as number | null,
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
    deliveryDate: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 作業者一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
    }
  }, [isOpen]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, unit_price_ratio')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('作業者一覧取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (field: string, value: string | number) => {
    const updatedData = {
      ...formData,
      [field]: value
    };

    // 作業者選択時に、IDも設定
    if (field === 'assignee') {
      const selectedWorker = workers.find(worker => worker.name === value);
      updatedData.assigneeId = selectedWorker ? selectedWorker.id : null;
    }

    // 数量または単価が変更された場合、費用を自動計算
    if (field === 'quantity' || field === 'unitPrice' || field === 'assignee') {
      const quantity = field === 'quantity' ? Number(value) : formData.quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : formData.unitPrice;
      let selectedWorker = null;
      if (field === 'assignee') {
        selectedWorker = workers.find(worker => worker.name === value);
      } else {
        selectedWorker = workers.find(worker => worker.name === formData.assignee);
      }
      const unitPriceRatio = selectedWorker?.unit_price_ratio || 1.0;
      // 費用計算: 数量 × 単価 × 単価率（小数点切り捨て）
      updatedData.totalCost = Math.floor(quantity * unitPrice * unitPriceRatio);
    }

    setFormData(updatedData);

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const validateForm = async (): Promise<boolean> => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = '作業名は必須です';
    }

    if (!formData.status || formData.status === 0) {
      newErrors.status = '進捗は必須です';
    }

    // 進行中の作業のチェックは削除（複数作業の同時進行を可能にするため）

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!(await validateForm())) return;

    try {
      setSaving(true);
      
      const workData = {
        work_title: formData.name,
        status: formData.status,
        worker_id: formData.assigneeId,
        quantity: formData.quantity || null,
        unit_price: formData.unitPrice || null,
        delivery_date: formData.deliveryDate || null,
      };

      const { error } = await supabase
        .from('works')
        .insert([workData]);

      if (error) {
        if (error.message.includes('JWT') || 
            error.message.includes('unauthorized') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('expired') ||
            error.code === 'PGRST301') {
          alert('セッションが期限切れです。再度ログインしてください。');
          return;
        }
        throw error;
      }

      alert('作業が正常に追加されました。');
      onSave(); // 親コンポーネントのデータ再取得をトリガー
      handleClose();
    } catch (err) {
      console.error('作業追加エラー:', err);
      alert('作業の追加に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      status: 0,
      assignee: '',
      assigneeId: null,
      quantity: 0,
      unitPrice: 0,
      totalCost: 0,
      deliveryDate: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">作業追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* 作業名 (必須) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="作業名を入力してください"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>


          {/* 進捗 (必須) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              進捗 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={0}>選択してください</option>
              <option value={WorkStatus.REQUEST_PLANNED}>依頼予定</option>
              <option value={WorkStatus.REQUESTING}>依頼中</option>
              <option value={WorkStatus.IN_PROGRESS}>進行中</option>
              <option value={WorkStatus.IN_DELIVERY}>配送中</option>
              <option value={WorkStatus.PICKUP_REQUESTING}>集荷依頼中</option>
              <option value={WorkStatus.WAITING_DROPOFF}>持込待ち</option>
              <option value={WorkStatus.COMPLETED}>完了</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>

          {/* 作業者名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業者名
            </label>
            <select
              value={formData.assignee}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            >
              <option value="">{loading ? '読み込み中...' : '選択してください'}</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.name || ''}>
                  {worker.name || '名前未設定'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                placeholder="0"
              />
            </div>

            {/* 単価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単価
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                placeholder="0"
              />
            </div>

            {/* 費用 (自動計算) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                費用
              </label>
              <input
                type="text"
                value={`¥${formData.totalCost.toLocaleString()}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">※ 数量 × 単価 × 単価率で自動計算</p>
            </div>
          </div>

          {/* 納品予定日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              納品予定日
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkAddModal;