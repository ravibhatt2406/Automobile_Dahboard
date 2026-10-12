import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '@/types/auth';
import { UserRole, ROLE_PERMISSIONS, RolePermissions, ROLE_RANKS } from '@/types/roles';
import { authService } from '@/services/auth.service';

export function getAllowedSwitchRoles(user: UserProfile | null): UserRole[] {
  if (!user) return [];
  
  // Customer can NEVER switch to any employee or admin role
  if (user.activeRole === 'CUSTOMER' || user.roles.includes('CUSTOMER')) {
    return [];
  }

  // Find user's highest role rank (lowest numerical value)
  const highestUserRank = Math.min(...user.roles.map((r) => ROLE_RANKS[r] ?? 99));

  // If user is basic employee with no extra assigned roles, no role switching
  if (highestUserRank > 6 && user.roles.length <= 1) {
    return [];
  }

  const possibleRoles: UserRole[] = [
    'SUPER_ADMIN',
    'FRANCHISE_OWNER',
    'FRANCHISE_MANAGER',
    'BRANCH_OWNER',
    'BRANCH_MANAGER',
    'DEPARTMENT_MANAGER',
    'SALES_EMPLOYEE',
    'MECHANIC',
  ];

  return possibleRoles.filter((targetRole) => {
    if (targetRole === 'CUSTOMER') return false; // Customer is never an operational switch target

    // Allow if target role is explicitly assigned to user AND not higher than user's highest rank
    if (user.roles.includes(targetRole)) {
      return ROLE_RANKS[targetRole] >= highestUserRank;
    }

    // Downward operational workspace switching: target rank must be strictly greater than highestUserRank (lower authority)
    return ROLE_RANKS[targetRole] > highestUserRank;
  });
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  permissions: RolePermissions;
  allowedSwitchRoles: UserRole[];
  setActiveRole: (role: UserRole) => boolean;
  login: (emailOrPhone: string, password?: string, accountType?: 'customer' | 'organization') => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUserData = localStorage.getItem('titan_user_profile');
    const isAuth = localStorage.getItem('titan_is_authenticated');
    if (isAuth === 'false') return null;
    if (savedUserData) {
      try {
        return JSON.parse(savedUserData);
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    const token = localStorage.getItem('titan_auth_token');
    if (token) {
      authService.getCurrentUser().then((me: any) => {
        if (me) {
          const rawRoles: string[] = (me.roles as any[])?.map((r: any) => typeof r === 'string' ? r : r.name || r.role?.name) || [];
          const roles: UserRole[] = rawRoles.length > 0 ? (rawRoles as UserRole[]) : (me.accountType === 'SUPER_ADMIN' ? ['SUPER_ADMIN'] : ['CUSTOMER']);
          const activeRole: UserRole = me.activeRole || roles[0] || 'SUPER_ADMIN';

          const authenticatedUser: UserProfile = {
            id: me.id,
            email: me.email,
            phone: me.phone,
            firstName: me.firstName || me.email?.split('@')[0] || 'User',
            lastName: me.lastName || '',
            roles,
            activeRole,
            assignedBranchName: me.assignedBranchName || me.employee?.branch?.name,
            assignedFranchiseName: me.assignedFranchiseName || me.employee?.branch?.franchise?.name,
          };
          setUser(authenticatedUser);
          localStorage.setItem('titan_is_authenticated', 'true');
          localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
        } else {
          authService.logout();
          setUser(null);
        }
      });
    }
  }, []);

  const activeRole: UserRole = user?.activeRole || 'SUPER_ADMIN';
  const permissions: RolePermissions = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS.CUSTOMER;
  const allowedSwitchRoles = getAllowedSwitchRoles(user);

  const setActiveRole = (role: UserRole): boolean => {
    if (!user) return false;
    
    // Validate authorization
    const validTargets = getAllowedSwitchRoles(user);
    if (!validTargets.includes(role) && role !== user.activeRole) {
      console.warn(`Unauthorized role switch attempt to ${role}`);
      return false;
    }

    const updatedUser: UserProfile = { ...user, activeRole: role };
    setUser(updatedUser);
    localStorage.setItem('titan_user_profile', JSON.stringify(updatedUser));
    return true;
  };

  const login = async (
    emailOrPhone: string,
    password?: string,
    _accountType: 'customer' | 'organization' = 'organization'
  ): Promise<UserProfile> => {
    setIsLoading(true);
    const normalizedInput = emailOrPhone.toLowerCase().trim();

    if (!password || !password.trim()) {
      setIsLoading(false);
      throw new Error('Password is required.');
    }

    try {
      const loginRes = await authService.login({ emailOrPhone: normalizedInput, password });
      const backendUser: any = loginRes?.user;

      if (!backendUser) {
        throw new Error('Authentication failed. User profile could not be loaded.');
      }

      const rawRoles: string[] = (backendUser.roles as any[])?.map((r: any) => typeof r === 'string' ? r : r.name || r.role?.name) || [];
      const roles: UserRole[] = rawRoles.length > 0 ? (rawRoles as UserRole[]) : (backendUser.accountType === 'SUPER_ADMIN' ? ['SUPER_ADMIN'] : ['CUSTOMER']);
      const activeRole: UserRole = backendUser.activeRole || roles[0] || 'SUPER_ADMIN';

      const authenticatedUser: UserProfile = {
        id: backendUser.id,
        email: backendUser.email,
        phone: backendUser.phone,
        firstName: backendUser.firstName || backendUser.email?.split('@')[0] || 'User',
        lastName: backendUser.lastName || '',
        roles,
        activeRole,
        assignedBranchName: backendUser.assignedBranchName || backendUser.employee?.branch?.name,
        assignedFranchiseName: backendUser.assignedFranchiseName || backendUser.employee?.branch?.franchise?.name,
      };

      setUser(authenticatedUser);
      localStorage.setItem('titan_is_authenticated', 'true');
      localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
      return authenticatedUser;
    } catch (err: any) {
      console.warn('Backend authentication failed:', err?.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        activeRole,
        permissions,
        allowedSwitchRoles,
        setActiveRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
