// Authentication and user-related types

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'member' | 'viewer';
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomUser extends User {
  name: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

export interface AuthSession {
  user: CustomUser;
  accessToken: string;
  refreshToken?: string;
  expires: string;
}

export interface AuthState {
  user: CustomUser | null;
  isLoading: boolean;
  error: string | null;
}