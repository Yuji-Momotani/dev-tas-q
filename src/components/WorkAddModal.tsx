import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, ChevronDown } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Database } from '../types/database.types';
import { WorkStatus } from '../constants/workStatus';

type Worker = Database['public']['Tables']['workers']['Row'];
type Group = Database['public']['Tables']['groups']['Row'];

interface WorkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const WorkAddModal: React.FC<WorkAddModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    status: 0, // 0: 未選択, 1: 予定なし, 2: 予定, 3: 着手中, 4: 完了
    assignee: '',
    assigneeId: null as number | null,
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
    deliveryDate: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupInput, setGroupInput] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  // 作業者一覧とグループ一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
      fetchGroups();
    }
  }, [isOpen]);

  // グループ入力でフィルタリング
  useEffect(() => {
    const filtered = groups.filter(group => 
      group.name?.toLowerCase().includes(groupInput.toLowerCase())
    );
    setFilteredGroups(filtered);
  }, [groupInput, groups]);

  // 外クリック時にドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.group-selector')) {
        setShowGroupDropdown(false);
      }
    };

    if (showGroupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showGroupDropdown]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select('id, name')
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

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      console.error('グループ一覧取得エラー:', err);
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

  const handleGroupInputChange = (value: string) => {
    setGroupInput(value);
    setFormData(prev => ({ ...prev, group: value }));
    setShowGroupDropdown(true);
  };

  const handleGroupSelect = (groupName: string) => {
    setGroupInput(groupName);
    setFormData(prev => ({ ...prev, group: groupName }));
    setShowGroupDropdown(false);
  };

  const handleCreateGroup = async () => {
    if (!groupInput.trim()) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name: groupInput.trim() }])
        .select()
        .single();

      if (error) throw error;

      // グループ一覧を再取得
      await fetchGroups();
      
      // 新しく作成したグループを選択
      setFormData(prev => ({ ...prev, group: groupInput }));
      setShowGroupDropdown(false);
      
      alert('新しいグループが作成されました。');
    } catch (err) {
      console.error('グループ作成エラー:', err);
      alert('グループの作成に失敗しました。');
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`グループ「${groupName}」を削除しますか？`)) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', groupId);

      if (error) throw error;

      // グループ一覧を再取得
      await fetchGroups();
      
      // 削除したグループが選択されていた場合はクリア
      if (formData.group === groupName) {
        setFormData(prev => ({ ...prev, group: '' }));
        setGroupInput('');
      }
      
      alert('グループが削除されました。');
    } catch (err) {
      console.error('グループ削除エラー:', err);
      alert('グループの削除に失敗しました。');
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

    // 着手中の場合、同じ作業者が既に着手中の作業を持っていないかチェック
    if (formData.status === WorkStatus.IN_PROGRESS && formData.assigneeId) {
      try {
        const { data, error } = await supabase
          .from('works')
          .select('id, work_title')
          .eq('worker_id', formData.assigneeId)
          .eq('status', WorkStatus.IN_PROGRESS)
          .is('deleted_at', null);

        if (error) {
          console.error('着手中作業チェックエラー:', error);
          newErrors.status = '着手中作業の確認に失敗しました';
        } else if (data && data.length > 0) {
          newErrors.status = `選択した作業者は既に着手中の作業があります（作業ID: #${data[0].id}）`;
        }
      } catch (err) {
        console.error('着手中作業チェックエラー:', err);
        newErrors.status = '着手中作業の確認に失敗しました';
      }
    }

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
      group: '',
      status: 0,
      assignee: '',
      assigneeId: null,
      quantity: 0,
      unitPrice: 0,
      totalCost: 0,
      deliveryDate: ''
    });
    setErrors({});
    setGroupInput('');
    setShowGroupDropdown(false);
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
          <div className="relative group-selector">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              グループ
            </label>
            <div className="relative">
              <input
                type="text"
                value={groupInput}
                onChange={(e) => handleGroupInputChange(e.target.value)}
                onFocus={() => setShowGroupDropdown(true)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="グループを選択または入力してください"
              />
              <button
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            {showGroupDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {/* 新規作成オプション */}
                {groupInput && !filteredGroups.some(g => g.name === groupInput) && (
                  <div
                    onClick={handleCreateGroup}
                    className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">「{groupInput}」を新規作成</span>
                  </div>
                )}
                
                {/* 既存グループ一覧 */}
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                    >
                      <span
                        onClick={() => handleGroupSelect(group.name || '')}
                        className="flex-1"
                      >
                        {group.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id, group.name || '');
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="グループを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : groupInput && (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    該当するグループがありません
                  </div>
                )}
                
                {!groupInput && groups.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    グループがありません
                  </div>
                )}
              </div>
            )}
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
              <option value={WorkStatus.NO_PLAN}>予定なし</option>
              <option value={WorkStatus.PLANNED}>予定</option>
              <option value={WorkStatus.IN_PROGRESS}>着手中</option>
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