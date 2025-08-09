import { WorkStatus } from '../../constants/workStatus';

export interface WorkItem {
  id: string;
  name: string;
  status: WorkStatus;
  assignee?: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  deliveryDate?: string;
}

export interface User {
  email: string;
  isAuthenticated: boolean;
}

export interface Account {
  id: string;
  name: string;
  hasWorkListAccess: boolean;
  hasEmailAccess: boolean;
  hasLineAccess: boolean;
  hasChatworkAccess: boolean;
}

export interface AccountDetail extends Account {
  email: string;
  permissions: {
    view: boolean;
    register: boolean;
    update: boolean;
    delete: boolean;
  };
  notifications: {
    email: string;
    line: string;
    chatwork: string;
  };
  notificationSettings: {
    workRegistration: boolean;
    workStart: boolean;
    workComplete: boolean;
  };
}

export interface WorkerDetail {
  name: string;
  birthDate: string;
  address: string;
  nextVisitDate: string;
  hourlyRate: number;
  loginInfo: {
    email: string;
    password: string;
  };
  group: string;
  skills: string;
  workHistory: Array<{
    id: string;
    name: string;
    status: WorkStatus;
    quantity?: number;
    unitPrice?: number;
    totalCost?: number;
    deliveryDate?: string;
  }>;
}

export interface WorkVideo {
  id: string;
  workName: string;
  creator: string;
  createdAt: string;
}