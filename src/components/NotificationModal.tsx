import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkers: Array<{ id: string; name: string }>;
  onConfirm: (data: { recipients: string[]; title: string; content: string }) => void;
  onRemoveWorker: (workerId: string) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  selectedWorkers,
  onConfirm,
  onRemoveWorker
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeRecipient = (workerId: string) => {
    onRemoveWorker(workerId);
    
    // 送信者が1名のみの場合、削除後に0名になるのでモーダルを閉じる
    if (selectedWorkers.length === 1) {
      handleClose();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (selectedWorkers.length === 0) {
      newErrors.recipients = '送信対象者を選択してください';
    }

    if (!formData.title.trim()) {
      newErrors.title = '件名は必須です';
    }

    if (!formData.content.trim()) {
      newErrors.content = '本文は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (validateForm()) {
      onConfirm({
        recipients: selectedWorkers.map(worker => worker.id),
        title: formData.title,
        content: formData.content
      });
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: ''
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
          <h2 className="text-xl font-semibold text-gray-800">通達実施</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* 送信対象者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              送信対象者 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {selectedWorkers.length === 0 ? (
                <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
                  送信対象者が選択されていません。作業者一覧でチェックボックスを選択してください。
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                    >
                      <span>{worker.id} / {worker.name}</span>
                      <button
                        onClick={() => removeRecipient(worker.id)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.recipients && (
              <p className="mt-1 text-sm text-red-600">{errors.recipients}</p>
            )}
          </div>

          {/* 件名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="○○○作業依頼について"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              本文 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`お疲れ様です。
○○です。
○○○○の作業依頼に...`}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t border-gray-200">
          <button
            onClick={handleSend}
            className="px-8 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            送信確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;