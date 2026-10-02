import { UserProfile } from '@/types/auth';
import { apiFetch } from './apiClient';

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: UserProfile;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: UserProfile;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<{ accessToken?: string; refreshToken?: string; user?: UserProfile }> {
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.emailOrPhone,
        password: payload.password,
      }),
    });

    const accessToken = response?.data?.accessToken || response?.accessToken;
    const refreshToken = response?.data?.refreshToken || response?.refreshToken;
    const user = response?.data?.user || response?.user;

    if (accessToken) {
      localStorage.setItem('titan_auth_token', accessToken);
      localStorage.setItem('titan_is_authenticated', 'true');
    }
    if (refreshToken) {
      localStorage.setItem('titan_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('titan_user_profile', JSON.stringify(user));
    }

    return { accessToken, refreshToken, user };
  },

  async forgotPassword(emailOrPhone: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone }),
      });
    } catch {
      throw new Error('Password reset service unreachable.');
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const response = await apiFetch<any>('/auth/me');
      const user = response?.data?.user || response?.user;
      if (user) {
        localStorage.setItem('titan_user_profile', JSON.stringify(user));
        return user as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      localStorage.removeItem('titan_auth_token');
      localStorage.removeItem('titan_refresh_token');
      localStorage.removeItem('titan_is_authenticated');
      localStorage.removeItem('titan_user_profile');
    }
  },
};

