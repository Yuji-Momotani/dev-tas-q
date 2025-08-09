export interface Admin {
  id: number;
  name: string;
  email: string;
  authUserID: string;
}

export interface AdminDetail extends Admin {
  permissions: AdminPermissions;
  notifications: AdminNotifications;
  notificationSettings: NotificationSettings;
}

export interface AdminPermissions {
  view: boolean;
  register: boolean;
  update: boolean;
  delete: boolean;
}

export interface AdminNotifications {
  email: string;
  line?: string;
  chatwork?: string;
}

export interface NotificationSettings {
  workRegistration: boolean;
  workStart: boolean;
  workComplete: boolean;
}

export interface AdminNotificationType {
  id: number;
  adminID: number;
  type: number;
}