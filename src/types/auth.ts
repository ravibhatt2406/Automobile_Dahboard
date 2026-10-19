import { UserRole } from './roles';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roles: UserRole[];
  activeRole: UserRole;
  assignedFranchiseId?: string;
  assignedFranchiseName?: string;
  assignedBranchId?: string;
  assignedBranchName?: string;
  accountType?: string;
  createdAt?: string;
}

export interface ScopeContextState {
  selectedFranchiseId: string | 'ALL';
  selectedBranchId: string | 'ALL';
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
