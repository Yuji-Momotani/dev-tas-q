export const formatDateTimeJP = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 日本時間に変換
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const formatDateJP = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};