export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface VersionSnapshot {
  version: number;
  content: string;
  updatedAt: number;
}
export interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  isPublic?: boolean;
  userId: string;
  version: number;
  versions?: VersionSnapshot[];
  viewCount?: number;
}
export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'free' | 'pro';
export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  passwordHash?: string;
  salt?: string;
  createdAt?: number;
  isBanned?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  planExpiresAt?: number;
  refreshVersion?: number;
  // Better-Auth & MFA Extensions
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  emailVerified?: boolean;
  image?: string;
}
export interface MfaChallenge {
  error: 'two-factor-required';
  twoFactorToken: string;
  userId: string;
}
export interface SystemLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'security';
  event: string;
  userId?: string;
  ip?: string;
  details?: string;
}
export interface AdminStats {
  totalUsers: number;
  totalDocs: number;
  activeShares: number;
  storageUsed: number;
  bannedUsers: number;
  totalStorageBytes: number;
  recentErrors: number;
  dailyStats: ChartData[];
}
export interface ChartData {
  date: string;
  docs: number;
  users: number;
}
export interface EditorSettings {
  theme: string;
  fontSize: number;
  compactMode?: boolean;
}
export interface AuthResponse {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: number;
  };
}
export interface Chat {
  id: string;
  title: string;
}
export interface ClientError {
  id: string;
  timestamp: number;
  message: string;
  category?: 'react' | 'javascript' | 'network' | 'user' | 'unknown';
  url: string;
  level: 'error' | 'warning' | 'info';
  stackTrace?: string;
  parsedStack?: string;
  componentStack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}