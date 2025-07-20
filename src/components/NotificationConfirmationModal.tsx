import React from 'react';
import { X } from 'lucide-react';

interface NotificationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedWorkers: Array<{ id: string; name: string }>;
  title: string;
  content: string;
}

const NotificationConfirmationModal: React.FC<NotificationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedWorkers,
  title,
  content
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">通達実施内容確認</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 送信対象者 */}
          <div>
            <div className="flex items-center mb-3">
              <div className="w-4 h-4 bg-black rounded-sm mr-2"></div>
              <label className="text-sm font-medium text-gray-700">送信対象者</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="inline-flex items-center bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <span>{worker.id} / {worker.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 件名 */}
          <div>
            <div className="flex items-center mb-3">
              <div className="w-4 h-4 bg-black rounded-sm mr-2"></div>
              <label className="text-sm font-medium text-gray-700">件名</label>
            </div>
            <div className="text-sm text-gray-900">
              {title}
            </div>
          </div>

          {/* 本文 */}
          <div>
            <div className="flex items-center mb-3">
              <div className="w-4 h-4 bg-black rounded-sm mr-2"></div>
              <label className="text-sm font-medium text-gray-700">本文</label>
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">
              {content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-8 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationConfirmationModal;