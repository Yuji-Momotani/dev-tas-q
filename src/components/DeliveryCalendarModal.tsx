import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Work } from '../types/work';
import WorkStatusBadge from './WorkStatusBadge';

interface DeliveryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: Work[];
}

interface WorkDetail {
  work: Work;
}

const DeliveryCalendarModal: React.FC<DeliveryCalendarModalProps> = ({
  isOpen,
  onClose,
  workItems,
}) => {
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = (offset: number = 0) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + offset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const getWorksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return workItems.filter(work => {
      if (!work.scheduledDeliveryDate) return false;
      const deliveryDateStr = new Date(work.scheduledDeliveryDate).toISOString().split('T')[0];
      return deliveryDateStr === dateStr;
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getDayName = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handlePrevWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleWorkClick = (work: Work) => {
    setSelectedWork(work);
  };

  const handleCloseDetail = () => {
    setSelectedWork(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">納入カレンダー</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <button
            onClick={handlePrevWeek}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
            <span>前週</span>
          </button>
          <div className="text-lg font-medium">
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </div>
          <button
            onClick={handleNextWeek}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <span>次週</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-2 min-h-[500px]">
            {weekDates.map((date, index) => {
              const works = getWorksForDate(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`border rounded-lg overflow-hidden ${
                    isTodayDate ? 'border-blue-500 border-2' : 'border-gray-200'
                  }`}
                >
                  <div className={`p-2 text-center border-b ${
                    isTodayDate ? 'bg-blue-100' : 'bg-gray-50'
                  }`}>
                    <div className="text-sm font-medium">{getDayName(date)}</div>
                    <div className="text-xs text-gray-600">{formatDate(date)}</div>
                  </div>
                  <div className="p-2 space-y-2">
                    {works.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4">
                        予定なし
                      </div>
                    ) : (
                      works.map(work => (
                        <div
                          key={work.id}
                          onClick={() => handleWorkClick(work)}
                          className="p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <div className="text-xs font-medium text-gray-700 truncate">
                            {work.workerName || '未割当'}
                          </div>
                          <div className="text-xs font-bold text-blue-600 mt-1">
                            {formatTime(work.scheduledDeliveryDate)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            {work.id} / {work.title}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedWork && (
        <WorkDetailModal work={selectedWork} onClose={handleCloseDetail} />
      )}
    </div>
  );
};

const WorkDetailModal: React.FC<WorkDetail> = ({ work, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">作業詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">作業ID</div>
                <div className="text-base font-medium">{work.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">進捗状況</div>
                <WorkStatusBadge status={work.status} />
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">作業名</div>
              <div className="text-base font-medium">{work.title}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">作業者</div>
              <div className="text-base font-medium">{work.workerName || '未割当'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">依頼日時</div>
                <div className="text-base">
                  {work.deliveryDate ? new Date(work.deliveryDate).toLocaleString('ja-JP') : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">納入予定日時</div>
                <div className="text-base">
                  {work.scheduledDeliveryDate ? new Date(work.scheduledDeliveryDate).toLocaleString('ja-JP') : '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">着手日時</div>
                <div className="text-base">
                  {work.start_date ? new Date(work.start_date).toLocaleString('ja-JP') : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">完了日時</div>
                <div className="text-base">
                  {work.complete_date ? new Date(work.complete_date).toLocaleString('ja-JP') : '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">個数</div>
                <div className="text-base">{work.quantity || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">単価</div>
                <div className="text-base">{work.unitPrice ? `¥${work.unitPrice.toLocaleString()}` : '-'}</div>
              </div>
            </div>

            {work.before_image && (
              <div>
                <div className="text-sm text-gray-600 mb-2">作業前画像</div>
                <img
                  src={work.before_image}
                  alt="作業前"
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}

            {work.after_image && (
              <div>
                <div className="text-sm text-gray-600 mb-2">作業後画像</div>
                <img
                  src={work.after_image}
                  alt="作業後"
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}

            {work.note && (
              <div>
                <div className="text-sm text-gray-600 mb-1">特記事項</div>
                <div className="text-base whitespace-pre-wrap">{work.note}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryCalendarModal;
