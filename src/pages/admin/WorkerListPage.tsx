import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import NotificationModal from '../../components/NotificationModal';
import NotificationConfirmationModal from '../../components/NotificationConfirmationModal';
import { mockWorkerDetails, mockWorkItems, workerMasterData } from '../../data/mockData';
import { UserPlus, Download, X } from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import { exportWorkerListCSV } from '../../utils/csvExport';

const WorkerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  // 通達実施モーダル関連の状態
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    recipients: string[];
    title: string;
    content: string;
  } | null>(null);
  
  // 作業者作成モーダル関連の状態
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    skills: '',
    group: ''
  });

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
    setShowWorkerModal(true);
  };

  const handleCloseWorkerModal = () => {
    setShowWorkerModal(false);
    setWorkerFormData({
      name: '',
      email: '',
      skills: '',
      group: ''
    });
  };

  const handleWorkerFormChange = (field: string, value: string) => {
    setWorkerFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual worker creation logic
    console.log('新しい作業者:', workerFormData);
    alert('作業者が作成されました！');
    handleCloseWorkerModal();
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
    setNotificationData(null);
  };

  const handleConfirmNotification = (data: { recipients: string[]; title: string; content: string }) => {
    setNotificationData(data);
    setIsNotificationModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setNotificationData(null);
    setIsNotificationModalOpen(true);
  };

  const handleFinalSend = () => {
    if (notificationData) {
      console.log('通達送信:', notificationData);
      alert(`${notificationData.recipients.length}名の作業者に通達を送信しました。`);
      // 送信後、チェックボックスをクリア
      setCheckedItems(new Set());
      setIsConfirmationModalOpen(false);
      setNotificationData(null);
    }
  };

  const handleRemoveWorker = (workerId: string) => {
    const newCheckedItems = new Set(checkedItems);
    newCheckedItems.delete(workerId);
    setCheckedItems(newCheckedItems);
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
              onClick={handleAddWorker}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              作業者作成
            </button>
            <button
              onClick={handleNotification}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              通達実施
            </button>
            
            <SearchBar onSearch={() => {}} />
            
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
        onConfirm={handleConfirmNotification}
        onRemoveWorker={handleRemoveWorker}
      />
      
      {/* 通達実施内容確認モーダル */}
      <NotificationConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleFinalSend}
        selectedWorkers={getSelectedWorkers()}
        title={notificationData?.title || ''}
        content={notificationData?.content || ''}
      />

      {/* 作業者作成モーダル */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                作業者作成
              </h2>
              <button
                onClick={handleCloseWorkerModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleWorkerSubmit} className="p-6">
              {/* 作業者氏名 */}
              <div className="mb-4">
                <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 mb-2">
                  作業者氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="workerName"
                  value={workerFormData.name}
                  onChange={(e) => handleWorkerFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="作業者氏名を入力してください"
                  required
                />
              </div>

              {/* メールアドレス */}
              <div className="mb-4">
                <label htmlFor="workerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="workerEmail"
                  value={workerFormData.email}
                  onChange={(e) => handleWorkerFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="example@example.com"
                  required
                />
              </div>

              {/* スキル */}
              <div className="mb-4">
                <label htmlFor="workerSkills" className="block text-sm font-medium text-gray-700 mb-2">
                  スキル
                </label>
                <textarea
                  id="workerSkills"
                  value={workerFormData.skills}
                  onChange={(e) => handleWorkerFormChange('skills', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="スキルについて入力してください"
                />
              </div>

              {/* グループ */}
              <div className="mb-6">
                <label htmlFor="workerGroup" className="block text-sm font-medium text-gray-700 mb-2">
                  グループ <span className="text-red-500">*</span>
                </label>
                <select
                  id="workerGroup"
                  value={workerFormData.group}
                  onChange={(e) => handleWorkerFormChange('group', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">グループを選択してください</option>
                  <option value="グループAA">グループAA</option>
                  <option value="グループBA">グループBA</option>
                  <option value="グループ3B">グループ3B</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseWorkerModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <footer className="p-4 text-right text-xs text-gray-500">
        ©️〇〇〇〇会社
      </footer>
    </div>
  );
};

export default WorkerListPage;