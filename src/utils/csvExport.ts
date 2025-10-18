import { Work } from '../types/work';
import { WorkStatus, getWorkStatusLabel } from '../constants/workStatus';

// CSV形式の文字列を生成するヘルパー関数
export const generateCSV = (headers: string[], rows: string[][]): string => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

// CSVファイルをダウンロードするヘルパー関数
export const downloadCSV = (csvContent: string, filename: string): void => {
  // BOMを追加してExcelで文字化けを防ぐ
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 作業状況一覧のCSV出力
export const exportWorkListCSV = (workItems: Work[]): void => {
  const headers = [
    '作業名',
    '進捗',
    '作業者名',
    '数量',
    '単価',
    '費用',
    '納入締切日',
    '納品予定日'
  ];

  const getStatusText = (status: Work['status']): string => {
    return getWorkStatusLabel(status);
  };

  const rows = workItems.map(item => [
    `#${item.id} / ${item.title}`,
    getStatusText(item.status),
    item.workerName || '-',
    item.quantity.toString(),
    `¥${item.unitPrice}`,
    `¥${item.cost.toLocaleString()}`,
    item.deliveryDate ? item.deliveryDate.toLocaleDateString('ja-JP') : '-',
    item.scheduledDeliveryDate ? item.scheduledDeliveryDate.toLocaleDateString('ja-JP') : '-'
  ]);

  const csvContent = generateCSV(headers, rows);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  downloadCSV(csvContent, `作業状況一覧_${timestamp}.csv`);
};

// 作業者一覧のCSV出力
export const exportWorkerListCSV = (workers: Array<{id: string, name: string}>): void => {
  const headers = [
    '作業者名',
    '着手中作業',
    '予定作業',
    '次回来社日',
    '最終作業日時',
    'スキル',
    'グループ'
  ];

  const rows = workers.map(worker => [
    `${worker.id} / ${worker.name}`,
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ]);

  const csvContent = generateCSV(headers, rows);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  downloadCSV(csvContent, `作業者一覧_${timestamp}.csv`);
};