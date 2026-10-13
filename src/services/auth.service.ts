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

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  termsAccepted: boolean;
}

export const authService = {
  async registerCustomer(payload: RegisterCustomerPayload): Promise<{ accessToken?: string; refreshToken?: string; user?: any; message?: string }> {
    const response = await apiFetch<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const accessToken = response?.tokens?.accessToken || response?.data?.tokens?.accessToken;
    const refreshToken = response?.tokens?.refreshToken || response?.data?.tokens?.refreshToken;
    const user = response?.user || response?.data?.user;

    if (accessToken) {
      localStorage.setItem('titan_auth_token', accessToken);
      localStorage.setItem('titan_is_authenticated', 'true');
    }
    if (refreshToken) {
      localStorage.setItem('titan_refresh_token', refreshToken);
    }
    if (user) {
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.name?.split(' ')[0] || user.name || 'Customer',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        roles: ['CUSTOMER'],
        activeRole: 'CUSTOMER',
      };
      localStorage.setItem('titan_user_profile', JSON.stringify(userProfile));
    }

    return { accessToken, refreshToken, user, message: response?.message };
  },

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

  async loginWithGoogle(credential: string): Promise<{ accessToken?: string; refreshToken?: string; user?: UserProfile }> {
    const response = await apiFetch<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    const accessToken = response?.data?.accessToken || response?.accessToken;
    const refreshToken = response?.data?.refreshToken || response?.refreshToken;
    const backendUser = response?.data?.user || response?.user;

    if (accessToken) {
      localStorage.setItem('titan_auth_token', accessToken);
      localStorage.setItem('titan_is_authenticated', 'true');
    }
    if (refreshToken) {
      localStorage.setItem('titan_refresh_token', refreshToken);
    }
    if (backendUser) {
      const rawRoles: string[] = (backendUser.roles as any[])?.map((r: any) => typeof r === 'string' ? r : r.name || r.role?.name) || [];
      const roles = rawRoles.length > 0 ? (rawRoles as any[]) : ['CUSTOMER'];
      const userProfile: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        phone: backendUser.phone,
        firstName: backendUser.firstName || backendUser.name?.split(' ')[0] || backendUser.email?.split('@')[0] || 'User',
        lastName: backendUser.lastName || backendUser.name?.split(' ').slice(1).join(' ') || '',
        roles,
        activeRole: 'CUSTOMER',
      };
      localStorage.setItem('titan_user_profile', JSON.stringify(userProfile));
      return { accessToken, refreshToken, user: userProfile };
    }

    return { accessToken, refreshToken };
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

