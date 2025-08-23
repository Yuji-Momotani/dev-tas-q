import React from 'react';
import { WorkStatus, getWorkStatusLabel, getWorkStatusBadgeClass } from '../constants/workStatus';

interface WorkStatusBadgeProps {
  status: WorkStatus;
}

const WorkStatusBadge: React.FC<WorkStatusBadgeProps> = ({ status }) => {
  const statusText = getWorkStatusLabel(status);
  const statusClass = getWorkStatusBadgeClass(status);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
      {statusText}
    </span>
  );
};

export default WorkStatusBadge;