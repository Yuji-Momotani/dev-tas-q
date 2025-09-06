import React, { useState } from 'react';
import NotificationModal from './NotificationModal';
import NotificationConfirmationModal from './NotificationConfirmationModal';
import { supabase } from '../utils/supabase';
import { Worker } from '../types/worker';
import { Mail } from 'lucide-react';

interface NotificationControllerProps {
  checkedItems: Set<string>;
  workers: Worker[];
  onClearCheckedItems: () => void;
  onRemoveWorker: (workerId: string) => void;
}

const NotificationController: React.FC<NotificationControllerProps> = ({
  checkedItems,
  workers,
  onClearCheckedItems,
  onRemoveWorker
}) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    recipients: string[];
    title: string;
    content: string;
  } | null>(null);

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

  const handleFinalSend = async () => {
    if (!notificationData) return;

    try {
      const selectedWorkerDetails = workers.filter(worker => 
        checkedItems.has(worker.id.toString())
      );

      const mailRecords = selectedWorkerDetails.map(worker => ({
        worker_id: worker.id,
        from: import.meta.env.VITE_MAIL_FROM_ADDRESS,
        to: worker.email,
				// to: 'kilroy.was.here1016@gmail.com',
        subject: notificationData.title,
        body: notificationData.content
      }));

      const { error } = await supabase
        .from('send_mails')
        .insert(mailRecords);

      if (error) {
        console.error('メール送信レコード挿入エラー:', error);
        alert('メール送信の準備中にエラーが発生しました。');
        return;
      }

      alert(`${notificationData.recipients.length}名の作業者にメールを送信しました。`);
      
      onClearCheckedItems();
      setIsConfirmationModalOpen(false);
      setNotificationData(null);
      
    } catch (err) {
      console.error('メール送信処理エラー:', err);
      alert('メール送信中にエラーが発生しました。');
    }
  };

  const getSelectedWorkers = () => {
    return workers.filter(worker => checkedItems.has(worker.id.toString())).map(worker => ({
      id: worker.id.toString(),
      name: worker.name || '名前未設定'
    }));
  };

  return (
    <>
      <button
        onClick={handleNotification}
        className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
      >
        <Mail size={16} />
        <span>通達実施</span>
      </button>

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={handleCloseNotificationModal}
        selectedWorkers={getSelectedWorkers()}
        onConfirm={handleConfirmNotification}
        onRemoveWorker={onRemoveWorker}
      />
      
      <NotificationConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleFinalSend}
        selectedWorkers={getSelectedWorkers()}
        title={notificationData?.title || ''}
        content={notificationData?.content || ''}
      />
    </>
  );
};

export default NotificationController;