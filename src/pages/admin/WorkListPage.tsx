import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkStatusBadge from '../../components/WorkStatusBadge';
import { mockWorkItems, workerMasterData } from '../../data/mockData';
import { WorkItem } from '../../types';
import { Download } from 'lucide-react';
import { exportWorkListCSV } from '../../utils/csvExport';

const WorkListPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleAccountManagement = () => {
    navigate('/admin/account-management');
  };

  const handleWorkVideos = () => {
    navigate('/admin/work-videos');
  };
  const [workItems, setWorkItems] = useState<WorkItem[]>(mockWorkItems);
  const [filteredItems, setFilteredItems] = useState<WorkItem[]>(mockWorkItems);
  const [freewordQuery, setFreewordQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  // 検索フィルターを適用する関数
  const applyFilters = () => {
    let filtered = [...workItems];

    // フリーワード検索（作業名での前後方一致）
    if (freewordQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(freewordQuery.toLowerCase())
      );
    }

    // 納品予定日の範囲検索
    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        if (!item.deliveryDate) return false;
        
        // 日付形式を変換 (YYYY.MM.DD -> YYYY-MM-DD)
        const itemDateStr = item.deliveryDate.replace(/\./g, '-');
        const itemDate = new Date(itemDateStr);
        
        if (startDate && new Date(startDate) > itemDate) return false;
        if (endDate && new Date(endDate) < itemDate) return false;
        
        return true;
      });
    }

    // 作業者名検索
    if (selectedWorker) {
      filtered = filtered.filter((item) => 
        item.assignee === selectedWorker
      );
    }

    setFilteredItems(filtered);
  };

  // 検索ボタンクリック時の処理
  const handleSearch = () => {
    applyFilters();
  };

  // フリーワード入力時の処理
  const handleFreewordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreewordQuery(e.target.value);
  };

  // 納品予定日変更時の処理
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // 作業者選択時の処理
  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorker(e.target.value);
  };

  const handleRowClick = (id: string) => {
    // Remove special characters and spaces from the ID
    const cleanId = id.split('/')[0].trim();
    navigate(`/admin/work-detail/${encodeURIComponent(cleanId)}`);
  };

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleAddWork = () => {
    navigate('/admin/worker-list');
  };

  const handleExportCSV = () => {
    exportWorkListCSV(filteredItems);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業状況一覧</h1>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
            onClick={handleAddWork}
            className="px-4 py-1 border border-white rounded text-sm hover:bg-green-700"
          >
            作業者一覧
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
        {/* Navigation buttons */}
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
        
        <div className="bg-white rounded-md shadow-sm p-4 mb-6">
          {/* Filter controls */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <button
              onClick={handleAddWork}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              作業追加
            </button>
            
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              検索
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">フリーワード</span>
              <input
                type="text"
                value={freewordQuery}
                onChange={handleFreewordChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-48"
                placeholder="作業名で検索"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">納品予定日</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">作業者</span>
              <select
                value={selectedWorker}
                onChange={handleWorkerChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">全て</option>
                {workerMasterData.map((worker) => (
                  <option key={worker.id} value={worker.name}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="ml-auto flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Download size={16} />
              <span>CSV出力</span>
            </button>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作業名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    進捗
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    作業者名
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    数量
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    単価
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    費用
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                    納品予定日
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(item.id)}
                  >
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                      {item.id} / {item.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      <WorkStatusBadge status={item.status} />
                    </td>
                    <td 
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.assignee) {
                          navigate(`/admin/worker-detail/${encodeURIComponent(item.assignee)}`);
                        }
                      }}
                    >
                      {item.assignee || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.quantity || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.unitPrice ? `¥${item.unitPrice}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.totalCost ? `¥${item.totalCost.toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-500">
                      {item.deliveryDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkListPage;