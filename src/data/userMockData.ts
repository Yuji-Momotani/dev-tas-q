import { UserWorkItem } from '../types/user';

// ユーザー作業データのモック
export const mockUserWorkItems: Record<string, UserWorkItem[]> = {
  // 作業がないユーザー
  'test@example.com': [],
  
  // 作業があるユーザー
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

// ユーザーの作業を取得する関数
export const getUserWorkItems = (userId: string): UserWorkItem[] => {
  return mockUserWorkItems[userId] || [];
};

// 作業があるかどうかを判定する関数
export const hasActiveWork = (userId: string): boolean => {
  const workItems = getUserWorkItems(userId);
  return workItems.some(item => item.status === 'in-progress' || item.status === 'waiting');
};

// QRコード読み取り後の作業データを設定する関数
export const setUserWorkFromQR = (userId: string, qrData: string): void => {
  // QRコードのデータに関係なく、モックデータを設定
  mockUserWorkItems[userId] = [{
    id: 'work-qr-001',
    companyName: '株式会社 音光堂',
    workName: 'Aハンダ',
    status: 'in-progress',
    assignedAt: new Date(),
    startedAt: new Date()
  }];
};

// ユーザーの作業データを初期化する関数
export const clearUserWorkData = (userId: string): void => {
  mockUserWorkItems[userId] = [];
};