import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '@/types/auth';
import { UserRole, ROLE_PERMISSIONS, RolePermissions, ROLE_RANKS, ROLE_LABELS } from '@/types/roles';
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
  registerCustomer: (payload: { name: string; email: string; phone?: string; password: string; termsAccepted: boolean }) => Promise<UserProfile>;
  loginWithGoogle: (credential: string, portal?: 'customer' | 'organization') => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapBackendUserToProfile(me: any): UserProfile {
  const rawRoles: string[] = (me.roles as any[])
    ?.map((r: any) => typeof r === 'string' ? r : r.name || r.role?.name)
    .filter((r: string) => r && Object.prototype.hasOwnProperty.call(ROLE_LABELS, r)) || [];

  if (me.accountType === 'CUSTOMER' || me.role === 'CUSTOMER') {
    if (!rawRoles.includes('CUSTOMER')) rawRoles.push('CUSTOMER');
  }
  const isCustomer = me.accountType === 'CUSTOMER' || me.role === 'CUSTOMER' || rawRoles.includes('CUSTOMER');

  let roles: UserRole[];
  if (rawRoles.length > 0) {
    roles = rawRoles as UserRole[];
  } else if (isCustomer) {
    roles = ['CUSTOMER'];
  } else if (me.accountType === 'SUPER_ADMIN') {
    roles = ['SUPER_ADMIN'];
  } else {
    roles = ['UNASSIGNED'];
  }

  let activeRole: UserRole;
  if (isCustomer) {
    activeRole = 'CUSTOMER';
  } else if (me.activeRole && roles.includes(me.activeRole)) {
    activeRole = me.activeRole;
  } else if (roles.length > 0 && roles[0] !== 'UNASSIGNED') {
    activeRole = roles[0];
  } else {
    activeRole = 'UNASSIGNED';
  }

  return {
    id: me.id,
    email: me.email,
    phone: me.phone,
    firstName: me.firstName || me.name?.split(' ')[0] || me.email?.split('@')[0] || 'User',
    lastName: me.lastName || me.name?.split(' ').slice(1).join(' ') || '',
    roles,
    activeRole,
    assignedBranchId: me.assignedBranchId || me.scope?.branchId || me.employeeProfile?.branchId || me.employee?.branch?.id || me.branch?.id,
    assignedBranchName: me.assignedBranchName || me.employeeProfile?.branch?.name || me.employee?.branch?.name || me.branch?.name,
    assignedFranchiseId: me.assignedFranchiseId || me.scope?.franchiseId || me.employeeProfile?.branch?.franchiseId || me.franchise?.id,
    assignedFranchiseName: me.assignedFranchiseName || me.employeeProfile?.branch?.franchise?.name || me.franchise?.name,
    accountType: me.accountType,
    customerId: me.customerId || me.customerProfile?.id || me.customer?.id || null,
    customerProfile: me.customerProfile || me.customer || null,
    employeeId: me.employeeId || me.employeeProfile?.id || me.employee?.id || null,
    employeeProfile: me.employeeProfile || me.employee || null,
    preferredBranchId: me.customerProfile?.preferredBranchId || me.customer?.preferredBranchId || null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUserData = localStorage.getItem('titan_user_profile');
    const isAuth = localStorage.getItem('titan_is_authenticated');
    if (isAuth === 'false') return null;
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        if (parsed && typeof parsed === 'object') {
          return mapBackendUserToProfile(parsed);
        }
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
          const authenticatedUser = mapBackendUserToProfile(me);
          setUser(authenticatedUser);
          localStorage.setItem('titan_is_authenticated', 'true');
          localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
          localStorage.setItem('titan_active_role', authenticatedUser.activeRole);
        } else {
          authService.logout();
          setUser(null);
        }
      });
    }
  }, []);

  const activeRole: UserRole = user?.activeRole || 'UNASSIGNED';
  const permissions: RolePermissions = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS.UNASSIGNED;
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
    localStorage.setItem('titan_active_role', role);
    return true;
  };

  const login = async (
    emailOrPhone: string,
    password?: string,
    accountType: 'customer' | 'organization' = 'organization'
  ): Promise<UserProfile> => {
    setIsLoading(true);
    const normalizedInput = emailOrPhone.toLowerCase().trim();

    if (!password || !password.trim()) {
      setIsLoading(false);
      throw new Error('Password is required.');
    }

    // Clear any previous stale session before storing new authentication
    localStorage.removeItem('titan_active_role');
    localStorage.removeItem('titan_active_branch_id');
    localStorage.removeItem('titan_active_franchise_id');
    localStorage.removeItem('titan_user_profile');

    try {
      const loginRes = await authService.login({
        emailOrPhone: normalizedInput,
        password,
        portal: accountType,
      });
      const backendUser: any = loginRes?.user;

      if (!backendUser) {
        throw new Error('Authentication failed. User profile could not be loaded.');
      }

      const authenticatedUser = mapBackendUserToProfile(backendUser);

      // Validate portal authorization on client
      if (accountType === 'customer') {
        const isAuthorizedCustomer =
          authenticatedUser.accountType === 'CUSTOMER' ||
          authenticatedUser.roles.includes('CUSTOMER') ||
          !!authenticatedUser.customerProfile ||
          !!authenticatedUser.customerId;

        if (!isAuthorizedCustomer) {
          await logout();
          throw new Error(
            'This account belongs to dealership staff. Please sign in through the Enterprise Operations Portal (/login/organization).'
          );
        }
      } else if (accountType === 'organization') {
        const isAuthorizedOrg =
          authenticatedUser.accountType !== 'CUSTOMER' ||
          authenticatedUser.roles.some((r) => r !== 'CUSTOMER') ||
          !!authenticatedUser.employeeProfile;

        if (!isAuthorizedOrg) {
          await logout();
          throw new Error(
            'This account is registered for customer access. Please sign in through the Client Portal (/login/customer).'
          );
        }
      }

      setUser(authenticatedUser);
      localStorage.setItem('titan_is_authenticated', 'true');
      localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
      localStorage.setItem('titan_active_role', authenticatedUser.activeRole);
      return authenticatedUser;
    } catch (err: any) {
      console.warn('Backend authentication failed:', err?.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    termsAccepted: boolean;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authService.registerCustomer(payload);
      const backendUser = res.user;
      if (!backendUser) {
        throw new Error('Registration completed but profile not returned.');
      }
      const authenticatedUser = mapBackendUserToProfile(backendUser);
      setUser(authenticatedUser);
      localStorage.setItem('titan_is_authenticated', 'true');
      localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
      localStorage.setItem('titan_active_role', 'CUSTOMER');
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, portal?: 'customer' | 'organization'): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(credential, portal);
      if (!res.user) {
        throw new Error('Google authentication succeeded but profile could not be loaded.');
      }
      const authenticatedUser = mapBackendUserToProfile(res.user);
      setUser(authenticatedUser);
      localStorage.setItem('titan_is_authenticated', 'true');
      localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
      localStorage.setItem('titan_active_role', authenticatedUser.activeRole);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<UserProfile | null> => {
    try {
      const me: any = await authService.getCurrentUser();
      if (me) {
        const authenticatedUser = mapBackendUserToProfile(me);
        setUser(authenticatedUser);
        localStorage.setItem('titan_is_authenticated', 'true');
        localStorage.setItem('titan_user_profile', JSON.stringify(authenticatedUser));
        return authenticatedUser;
      }
      return null;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    localStorage.removeItem('titan_active_role');
    localStorage.removeItem('titan_active_branch_id');
    localStorage.removeItem('titan_active_franchise_id');
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
        registerCustomer,
        loginWithGoogle,
        logout,
        refreshUser,
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
