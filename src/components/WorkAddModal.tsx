import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { WorkItem } from '../types/admin';
import { workerMasterData } from '../data/mockData';

interface WorkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workItem: Omit<WorkItem, 'id'>) => void;
}

const WorkAddModal: React.FC<WorkAddModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    status: 'none' as WorkItem['status'],
    assignee: '',
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
    deliveryDate: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: string | number) => {
    const updatedData = {
      ...formData,
      [field]: value
    };

    // 数量または単価が変更された場合、費用を自動計算
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : formData.quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : formData.unitPrice;
      updatedData.totalCost = quantity * unitPrice;
    }

    setFormData(updatedData);

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = '作業名は必須です';
    }

    if (!formData.status || formData.status === 'none') {
      newErrors.status = '進捗は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      group: '',
      status: 'none',
      assignee: '',
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

          {/* グループ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              グループ
            </label>
            <select
              value={formData.group}
              onChange={(e) => handleInputChange('group', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">選択してください</option>
              <option value="グループAA">グループAA</option>
              <option value="グループBA">グループBA</option>
              <option value="グループ3B">グループ3B</option>
            </select>
          </div>

          {/* 進捗 (必須) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              進捗 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as WorkItem['status'])}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="none">選択してください</option>
              <option value="planned">予定</option>
              <option value="progress">着手中</option>
              <option value="completed">完了</option>
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
            >
              <option value="">選択してください</option>
              {workerMasterData.map((worker) => (
                <option key={worker.id} value={worker.name}>
                  {worker.name}
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
              <p className="mt-1 text-xs text-gray-500">※ 数量 × 単価で自動計算</p>
              <p className="mt-1 text-xs text-gray-500">※ 数量 × 単価で自動計算</p>
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
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkAddModal;