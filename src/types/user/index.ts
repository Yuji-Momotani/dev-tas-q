export interface UserLoginData {
  id: string;
  password: string;
  rememberMe: boolean;
}

export interface UserSession {
  id: string;
  isAuthenticated: boolean;
  loginTime: Date;
}

export interface UserWorkItem {
  id: string;
  companyName: string;
  workName: string;
  status: 'waiting' | 'in-progress' | 'completed';
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}