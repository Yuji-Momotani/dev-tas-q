import React from 'react';
import { WorkStatus } from '../constants/workStatus';

interface WorkStatusBadgeProps {
  status: WorkStatus;
}

const WorkStatusBadge: React.FC<WorkStatusBadgeProps> = ({ status }) => {
  let statusText = '';
  let statusClass = '';

  switch (status) {
    case WorkStatus.REQUEST_PLANNED:
      statusText = '依頼予定';
      statusClass = 'bg-gray-100 text-gray-800';
      break;
    case WorkStatus.REQUESTING:
      statusText = '依頼中';
      statusClass = 'bg-yellow-100 text-yellow-800';
      break;
    case WorkStatus.IN_PROGRESS:
      statusText = '進行中';
      statusClass = 'bg-blue-100 text-blue-800';
      break;
    case WorkStatus.IN_DELIVERY:
      statusText = '配送中';
      statusClass = 'bg-purple-100 text-purple-800';
      break;
    case WorkStatus.PICKUP_REQUESTING:
      statusText = '集荷依頼中';
      statusClass = 'bg-orange-100 text-orange-800';
      break;
    case WorkStatus.WAITING_DROPOFF:
      statusText = '持込待ち';
      statusClass = 'bg-indigo-100 text-indigo-800';
      break;
    case WorkStatus.COMPLETED:
      statusText = '完了';
      statusClass = 'bg-green-100 text-green-800';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
      {statusText}
    </span>
  );
};

export default WorkStatusBadge;