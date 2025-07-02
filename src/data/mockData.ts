import { WorkItem } from '../types';
import { Account, WorkVideo } from '../types';

export const mockWorkItems: WorkItem[] = [
  {
    id: '#123456',
    name: 'ハンダ',
    status: 'progress',
    assignee: '山田太郎',
    quantity: 40,
    unitPrice: 400,
    totalCost: 16000,
    deliveryDate: '2025.05.09'
  },
  {
    id: '#234567',
    name: 'Bパッキング',
    status: 'completed',
    assignee: '佐藤陽子',
    quantity: 100,
    unitPrice: 600,
    totalCost: 60000,
    deliveryDate: '2025.06.12'
  },
  {
    id: '・・・/ C組み立て',
    name: 'C組み立て',
    status: 'none',
    quantity: 60,
    unitPrice: 720,
    totalCost: 43200,
  },
  {
    id: '・・・/ ・・・',
    name: '・・・',
    status: 'planned',
    assignee: '加藤清作',
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
  },
  {
    id: '・・・/ ・・・2',
    name: '・・・',
    status: 'none',
    quantity: 0,
    unitPrice: 0,
    totalCost: 0,
  }
];

export const mockAccounts: Account[] = [
  {
    id: 'A-123456',
    name: 'マスター',
    hasWorkListAccess: true,
    hasEmailAccess: true,
    hasLineAccess: true,
    hasChatworkAccess: false
  },
  {
    id: 'A-234567',
    name: '・・・',
    hasWorkListAccess: true,
    hasEmailAccess: true,
    hasLineAccess: false,
    hasChatworkAccess: true
  },
  {
    id: 'A-34567B',
    name: '・・・',
    hasWorkListAccess: false,
    hasEmailAccess: false,
    hasLineAccess: false,
    hasChatworkAccess: false
  }
];

export const mockAccountDetails: Record<string, AccountDetail> = {
  'A-123456': {
    id: 'A-123456',
    name: 'マスター',
    hasWorkListAccess: true,
    hasEmailAccess: true,
    hasLineAccess: true,
    hasChatworkAccess: false,
    email: '□□□@XXXX.com',
    permissions: {
      view: true,
      register: true,
      update: true,
      delete: true
    },
    notifications: {
      email: '□□□@XXXX.com',
      line: '□□□@XXXX.com',
      chatwork: '□□□@XXXX.com'
    },
    notificationSettings: {
      workRegistration: false,
      workStart: true,
      workComplete: true
    }
  }
};

export const mockWorkerDetails: Record<string, WorkerDetail> = {
  '山田太郎': {
    name: '山田太郎',
    birthDate: '1971.2.16',
    address: '広島県福山市西町...',
    nextVisitDate: '2025.06.06',
    hourlyRate: 580,
    loginInfo: {
      email: 'kaf.web.sushi@XXXX.com',
      password: '********'
    },
    group: 'グループAA',
    skills: 'スキルについての詳細が入ります。スキルについての詳細が入ります。',
    workHistory: [
      { 
        id: '#123456', 
        name: 'ハンダ', 
        status: 'progress',
        quantity: 40,
        unitPrice: 400,
        totalCost: 16000,
        deliveryDate: '2025.05.09'
      },
      { 
        id: '#789012', 
        name: 'C組み立て', 
        status: 'planned',
        quantity: 25,
        unitPrice: 720,
        totalCost: 18000,
        deliveryDate: '2025.06.15'
      },
      { 
        id: '#345678', 
        name: 'Aパッキング', 
        status: 'completed',
        quantity: 80,
        unitPrice: 300,
        totalCost: 24000,
        deliveryDate: '2025.04.20'
      }
    ]
  },
  '佐藤陽子': {
    name: '佐藤陽子',
    birthDate: '1985.8.24',
    address: '広島県福山市東町...',
    nextVisitDate: '2025.05.29',
    hourlyRate: 620,
    loginInfo: {
      email: 'sato.yoko@XXXX.com',
      password: '********'
    },
    group: 'グループBA',
    skills: 'スキルについての詳細が入ります。',
    workHistory: [
      { 
        id: '#234567', 
        name: 'Bパッキング', 
        status: 'completed',
        quantity: 100,
        unitPrice: 600,
        totalCost: 60000,
        deliveryDate: '2025.06.12'
      },
      { 
        id: '#456789', 
        name: 'D検査', 
        status: 'progress',
        quantity: 50,
        unitPrice: 450,
        totalCost: 22500,
        deliveryDate: '2025.07.01'
      }
    ]
  },
  '加藤清作': {
    name: '加藤清作',
    birthDate: '1978.11.03',
    address: '広島県福山市南町...',
    nextVisitDate: '2025.06.10',
    hourlyRate: 650,
    loginInfo: {
      email: 'kato.seisaku@XXXX.com',
      password: '********'
    },
    group: 'グループ3B',
    skills: '組み立て作業に特化したスキルを持っています。精密作業が得意です。',
    workHistory: [
      { 
        id: '#567890', 
        name: 'E組み立て', 
        status: 'planned',
        quantity: 30,
        unitPrice: 800,
        totalCost: 24000,
        deliveryDate: '2025.07.15'
      }
    ]
  },
  '加藤清作': {
    name: '加藤清作',
    birthDate: '1978.11.03',
    address: '広島県福山市南町...',
    nextVisitDate: '2025.06.10',
    hourlyRate: 650,
    loginInfo: {
      email: 'kato.seisaku@XXXX.com',
      password: '********'
    },
    group: 'グループ3B',
    skills: '組み立て作業に特化したスキルを持っています。精密作業が得意です。',
    workHistory: [
      { id: '#567890', name: 'E組み立て', status: 'planned', quantity: 25, unitPrice: 800, totalCost: 20000, deliveryDate: '2025.07.15' }
    ]
  }
};

export const mockWorkVideos: WorkVideo[] = [
  {
    id: '1',
    workName: 'ハンダ付け',
    creator: 'マスター',
    createdAt: '2025.06.05 15:04:42'
  },
  {
    id: '2',
    workName: '〇〇組立',
    creator: '主任',
    createdAt: '2025.06.17 09:45:32'
  },
  {
    id: '3',
    workName: '-',
    creator: 'マスター',
    createdAt: '2025.06.19 16:35:01'
  }
];

// 作業者マスタデータ
export const workerMasterData = [
  { id: 'w-001', name: '山田太郎' },
  { id: 'w-002', name: '佐藤陽子' },
  { id: 'w-003', name: '加藤清作' },
  { id: 'w-004', name: '田中一郎' },
  { id: 'w-005', name: '鈴木花子' }
];