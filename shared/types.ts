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
}
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
}
export interface EditorSettings {
  theme: string;
  fontSize: number;
}
export interface AuthResponse {
  user: User;
  token: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}