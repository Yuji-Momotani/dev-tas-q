import { WorkerWorkItem } from '../types/worker';

// 作業者作業データのモック
export const mockWorkerWorkItems: Record<string, WorkerWorkItem[]> = {
  // 作業がない作業者
  'test@example.com': [],
  
  // 作業がある作業者
  'user2@example.com': [
    {
      id: 'work-001',
      companyName: '株式会社 音光堂',
      workName: 'Aハンダ',
      status: 'in-progress',
      assignedAt: new Date('2025-01-15T09:00:00'),
      startedAt: new Date('2025-01-15T10:30:00')
    }
  ],
};

// 作業者の作業を取得する関数
export const getWorkerWorkItems = (workerId: string): WorkerWorkItem[] => {
  return mockWorkerWorkItems[workerId] || [];
};

// 作業があるかどうかを判定する関数
export const hasActiveWork = (workerId: string): boolean => {
  const workItems = getWorkerWorkItems(workerId);
  return workItems.some(item => item.status === 'in-progress' || item.status === 'waiting');
};

// QRコード読み取り後の作業データを設定する関数
export const setWorkerWorkFromQR = (workerId: string, qrData: string): void => {
  // QRコードのデータに関係なく、モックデータを設定
  mockWorkerWorkItems[workerId] = [{
    id: 'work-qr-001',
    companyName: '株式会社 音光堂',
    workName: 'Aハンダ',
    status: 'in-progress',
    assignedAt: new Date(),
    startedAt: new Date()
  }];
};

// 作業者の作業データを初期化する関数
export const clearWorkerWorkData = (workerId: string): void => {
  mockWorkerWorkItems[workerId] = [];
};