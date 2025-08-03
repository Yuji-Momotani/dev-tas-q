export interface WorkerLoginData {
  id: string;
  password: string;
  rememberMe: boolean;
}

export interface WorkerSession {
  id: string;
  isAuthenticated: boolean;
  loginTime: Date;
}

export interface WorkerWorkItem {
  id: string;
  companyName: string;
  workName: string;
  status: 'waiting' | 'in-progress' | 'completed';
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}