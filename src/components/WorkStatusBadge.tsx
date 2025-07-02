import React from 'react';

interface WorkStatusBadgeProps {
  status: 'progress' | 'completed' | 'planned' | 'none';
}

const WorkStatusBadge: React.FC<WorkStatusBadgeProps> = ({ status }) => {
  let statusText = '';
  let statusClass = '';

  switch (status) {
    case 'progress':
      statusText = '着手中';
      statusClass = 'bg-blue-100 text-blue-800';
      break;
    case 'completed':
      statusText = '完了';
      statusClass = 'bg-green-100 text-green-800';
      break;
    case 'planned':
      statusText = '予定';
      statusClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'none':
      statusText = '-';
      statusClass = 'bg-gray-100 text-gray-800';
      break;
  }

  if (status === 'none') {
    return <span className="text-gray-500">-</span>;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
      {statusText}
    </span>
  );
};

export default WorkStatusBadge;