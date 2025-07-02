import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockWorkItems, workerMasterData } from '../../data/mockData';
import { WorkItem } from '../../types';
import { Edit, Play, Save, X } from 'lucide-react';

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workItem, setWorkItem] = useState<WorkItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    if (id) {
      // Clean up the ID and find the matching work item
      const decodedId = decodeURIComponent(id);
      const foundItem = mockWorkItems.find((item) => item.id.startsWith(decodedId));
      if (foundItem) {
        setWorkItem(foundItem);
        setEditedItem({ ...foundItem });
      }
    }
  }, [id]);

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleWorkList = () => {
    navigate('/admin/work-list');
  };

  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideos = () => {
    navigate('/admin/work-videos');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItem(workItem ? { ...workItem } : null);
  };

  const handleSave = () => {
    if (editedItem) {
      // Update the mock data (in a real app, this would be an API call)
      const itemIndex = mockWorkItems.findIndex(item => item.id === editedItem.id);
      if (itemIndex !== -1) {
        mockWorkItems[itemIndex] = { ...editedItem };
        setWorkItem({ ...editedItem });
      }
      setIsEditing(false);
      alert('変更が保存されました。');
    }
  };

  const handleInputChange = (field: keyof WorkItem, value: string | number) => {
    if (editedItem) {
      const updatedItem = {
        ...editedItem,
        [field]: value
      };

      // 数量または単価が変更された場合、費用を自動計算
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? Number(value) : editedItem.quantity;
        const unitPrice = field === 'unitPrice' ? Number(value) : editedItem.unitPrice;
        updatedItem.totalCost = quantity * unitPrice;
      }

      setEditedItem(updatedItem);
    }
  };

  if (!workItem || !editedItem) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-2">
              <span className="text-gray-600 text-sm">⋮⋮⋮</span>
            </div>
            <h1 className="text-lg font-medium">作業詳細</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleWorkList}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              作業状況一覧
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            >
              ログアウト
            </button>
          </div>
        </header>
        <div className="p-8 text-center">
          <p>作業が見つかりませんでした。</p>
          <button
            onClick={handleWorkList}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業詳細</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleWorkList}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            作業状況一覧
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            ログアウト
          </button>
        </div>
      </header>
      
      <div className="p-4">
        <div className="mb-4 flex space-x-2">
          <button
            onClick={handleAccountManagement}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            アカウント管理
          </button>
          <button
            onClick={handleWorkVideos}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
        </div>
        
        <div className="bg-white rounded-md shadow-sm p-6">
          <div className="mb-6 flex space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Edit size={16} />
                <span>編集</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Save size={16} />
                  <span>保存</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <X size={16} />
                  <span>キャンセル</span>
                </button>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Work Details */}
            <div className="space-y-6">
              {/* 作業ID - 編集不可（自動採番のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業ID</label>
                <div className="text-lg text-gray-900 ml-8">{editedItem.id}</div>
              </div>
              
              {/* 作業名 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業名</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedItem.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedItem.name}</div>
                  )}
                </div>
              </div>
              
              {/* 作業者名 - 編集可能（セレクトボックス） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">作業者名</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <select
                      value={editedItem.assignee || ''}
                      onChange={(e) => handleInputChange('assignee', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="">選択してください</option>
                      {workerMasterData.map((worker) => (
                        <option key={worker.id} value={worker.name}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg text-gray-900">{editedItem.assignee || '-'}</div>
                  )}
                </div>
              </div>
              
              {/* 数量 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">数量</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedItem.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedItem.quantity}</div>
                  )}
                </div>
              </div>
              
              {/* 単価 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">単価</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedItem.unitPrice}
                      onChange={(e) => handleInputChange('unitPrice', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">
                      ¥{editedItem.unitPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 費用 - 編集不可（自動計算のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">費用</label>
                <div className="ml-8 flex-1">
                  <div className="text-lg text-gray-900">
                    ¥{editedItem.totalCost.toLocaleString()}
                  </div>
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 数量 × 単価で自動計算されます
                    </div>
                  )}
                </div>
              </div>
              
              {/* 納品予定日 - 編集可能 */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">納品予定日</label>
                <div className="ml-8 flex-1">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedItem.deliveryDate ? editedItem.deliveryDate.replace(/\./g, '-') : ''}
                      onChange={(e) => handleInputChange('deliveryDate', e.target.value.replace(/-/g, '.'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-lg text-gray-900">{editedItem.deliveryDate || '-'}</div>
                  )}
                </div>
              </div>
              
              {/* 進捗ステータス - 編集不可（自動反映のため） */}
              <div className="border-b border-gray-200 pb-4 flex items-center">
                <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">進捗ステータス</label>
                <div className="ml-8">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                    着手中
                  </span>
                  {isEditing && (
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 作業の進行状況に応じて自動反映されます
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Work Video */}
            <div className="flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">作業手順動画</h3>
              <div className="bg-gray-300 aspect-video rounded-md flex items-center justify-center relative group cursor-pointer hover:bg-gray-400 transition-colors">
                <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-80 rounded-full group-hover:bg-opacity-100 transition-all">
                  <Play size={24} className="text-gray-600 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkDetailPage;