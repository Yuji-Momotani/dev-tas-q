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

export const generateMonthOptions = (startYearMonth?: string): Array<{ value: string; label: string }> => {
  const options: Array<{ value: string; label: string }> = [];
  
  const startDate = startYearMonth 
    ? new Date(startYearMonth.replace('/', '-') + '-01')
    : new Date('2025-10-01');
  
  const currentDate = new Date();
  
  let currentMonth = new Date(startDate);
  
  while (currentMonth <= currentDate) {
    const year = currentMonth.getFullYear();
    const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
    const value = `${year}/${month}`;
    
    options.push({
      value,
      label: value
    });
    
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  return options.reverse();
};

export const formatYearMonth = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  
  return `${year}/${month}`;
};