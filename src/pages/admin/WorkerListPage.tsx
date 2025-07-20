import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import NotificationModal from '../../components/NotificationModal';
import { mockWorkerDetails, mockWorkItems, workerMasterData } from '../../data/mockData';
import { UserPlus, Download } from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import { exportWorkerListCSV } from '../../utils/csvExport';

const WorkerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  // 通達実施モーダル関連の状態
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // ヘッダーチェックボックスの状態を計算
  const isAllChecked = workerMasterData.length > 0 && checkedItems.size === workerMasterData.length;
  const isIndeterminate = checkedItems.size > 0 && checkedItems.size < workerMasterData.length;

  // ヘッダーチェックボックスのクリック処理
  const handleHeaderCheckboxChange = () => {
    if (checkedItems.size > 0) {
      // 1行でもチェックが入っている場合は全て解除
      setCheckedItems(new Set());
    } else {
      // 全てにチェックを入れる
      const allIds = new Set(workerMasterData.map(worker => worker.id));
      setCheckedItems(allIds);
    }
  };

  // 個別チェックボックスのクリック処理
  const handleRowCheckboxChange = (workerId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(workerId)) {
      newCheckedItems.delete(workerId);
    } else {
      newCheckedItems.add(workerId);
    }
    setCheckedItems(newCheckedItems);
  };

  const handleLogout = () => {
    navigate('/admin/login');
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

  const handleAddWorker = () => {
    alert('作業者追加機能は現在実装中です。');
  };
  
  const handleNotification = () => {
    if (checkedItems.size === 0) {
      alert('通達を送信する作業者を選択してください。');
      return;
    }
    setIsNotificationModalOpen(true);
  };

  const handleCloseNotificationModal = () => {
    setIsNotificationModalOpen(false);
  };

  const handleSendNotification = (data: { recipients: string[]; title: string; content: string }) => {
    console.log('通達送信:', data);
    alert(`${data.recipients.length}名の作業者に通達を送信しました。`);
    // 送信後、チェックボックスをクリア
    setCheckedItems(new Set());
  };

  // チェックされた作業者の情報を取得
  const getSelectedWorkers = () => {
    return workerMasterData.filter(worker => checkedItems.has(worker.id));
  };

  const handleExportCSV = () => {
    exportWorkerListCSV(workerMasterData);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md p-2">
            <span className="text-gray-600 text-sm">⋮⋮⋮</span>
          </div>
          <h1 className="text-lg font-medium">作業者一覧</h1>
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
            onClick={handleWorkVideoList}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            作業動画一覧
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <button
              onClick={handleNotification}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              通達実施
            </button>
            
            <button
              onClick={handleAddWorker}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              検索
            </button>
            
            <SearchBar onSearch={() => {}} />
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">次回来社日</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">スキル</span>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全て</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">グループ</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全て</option>
                <option value="グループAA">グループAA</option>
                <option value="グループBA">グループBA</option>
                <option value="グループ3B">グループ3B</option>
              </select>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="ml-auto flex items-center space-x-1 px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Download size={16} />
              <span>CSV出力</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={isAllChecked}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleHeaderCheckboxChange}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    作業者名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    着手中作業
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    予定作業
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    次回来社日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    最終作業日時
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    スキル
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    グループ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workerMasterData.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => worker.name && navigate(`/admin/worker-detail/${encodeURIComponent(worker.name)}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(worker.id)}
                        onChange={() => handleRowCheckboxChange(worker.id)}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worker.id} / {worker.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 通達実施モーダル */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={handleCloseNotificationModal}
        selectedWorkers={getSelectedWorkers()}
        onSend={handleSendNotification}
      />
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkerListPage;