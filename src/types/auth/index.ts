export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'worker';
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface WorkerLoginCredentials {
  id: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}