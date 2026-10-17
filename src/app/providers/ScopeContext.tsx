import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types/roles';
import { Franchise, Branch } from '@/types/domain';
import { franchiseService } from '@/services/franchise.service';
import { branchService } from '@/services/branch.service';

// Roles that are strictly locked to their assigned branch
const BRANCH_SCOPED_ROLES: UserRole[] = [
  'BRANCH_MANAGER',
  'DEPARTMENT_MANAGER',
  'SALES_EMPLOYEE',
  'MECHANIC',
];

interface ScopeContextType {
  selectedFranchiseId: string | 'ALL';
  selectedBranchId: string | 'ALL';
  isBranchLocked: boolean;
  isFranchiseLocked: boolean;
  activeBranchName: string;
  activeFranchiseName: string;
  franchises: Franchise[];
  branches: Branch[];
  isLoadingScope: boolean;
  setSelectedFranchiseId: (id: string | 'ALL') => void;
  setSelectedBranchId: (id: string | 'ALL') => void;
  resetScope: () => void;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole } = useAuth();

  const isBranchLocked = BRANCH_SCOPED_ROLES.includes(activeRole);
  const isFranchiseLocked = ['FRANCHISE_OWNER', 'FRANCHISE_MANAGER'].includes(activeRole);

  const assignedBranchId = user?.assignedBranchId || '';
  const assignedBranchName = user?.assignedBranchName || '';
  const assignedFranchiseId = user?.assignedFranchiseId || '';
  const assignedFranchiseName = user?.assignedFranchiseName || '';

  // Read initial query params from URL if present
  const getInitialScope = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlFranchise = params.get('franchiseId');
      const urlBranch = params.get('branchId');
      return { urlFranchise, urlBranch };
    } catch {
      return { urlFranchise: null, urlBranch: null };
    }
  };

  const initialUrlScope = getInitialScope();

  const [selectedFranchiseId, setSelectedFranchiseState] = useState<string | 'ALL'>(() => {
    if (isBranchLocked && assignedFranchiseId) return assignedFranchiseId;
    if (isFranchiseLocked && assignedFranchiseId) return assignedFranchiseId;
    if (initialUrlScope.urlFranchise && initialUrlScope.urlFranchise !== 'ALL') return initialUrlScope.urlFranchise;
    return 'ALL';
  });

  const [selectedBranchId, setSelectedBranchState] = useState<string | 'ALL'>(() => {
    if (isBranchLocked && assignedBranchId) return assignedBranchId;
    if (initialUrlScope.urlBranch && initialUrlScope.urlBranch !== 'ALL') return initialUrlScope.urlBranch;
    return 'ALL';
  });

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingScope, setIsLoadingScope] = useState(false);

  // Sync URL query params with current scope
  const updateUrlScope = useCallback((franchiseId: string | 'ALL', branchId: string | 'ALL') => {
    try {
      const url = new URL(window.location.href);
      if (franchiseId && franchiseId !== 'ALL') {
        url.searchParams.set('franchiseId', franchiseId);
      } else {
        url.searchParams.delete('franchiseId');
      }

      if (branchId && branchId !== 'ALL') {
        url.searchParams.set('branchId', branchId);
      } else {
        url.searchParams.delete('branchId');
      }

      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore in test or unsupported environments
    }
  }, []);

  // Fetch franchises for authorized roles
  useEffect(() => {
    if (activeRole === 'CUSTOMER') return;

    let isMounted = true;
    const fetchFranchises = async () => {
      try {
        const res = await franchiseService.getFranchises();
        if (isMounted && res.data) {
          setFranchises(res.data);
        }
      } catch (err) {
        console.error('Failed to load franchises:', err);
      }
    };

    fetchFranchises();
    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  // Fetch branches cascading from selected franchise
  useEffect(() => {
    if (activeRole === 'CUSTOMER') return;

    let isMounted = true;
    const fetchBranches = async () => {
      setIsLoadingScope(true);
      try {
        const effectiveFranchise =
          isBranchLocked || isFranchiseLocked
            ? assignedFranchiseId
            : selectedFranchiseId !== 'ALL'
            ? selectedFranchiseId
            : undefined;

        const res = await branchService.getBranches({ franchiseId: effectiveFranchise });
        if (isMounted && res.data) {
          setBranches(res.data);

          // If current selected branch is not in the newly fetched branches and not 'ALL', reset to 'ALL'
          if (!isBranchLocked && selectedBranchId !== 'ALL') {
            const branchExists = res.data.some((b) => b.id === selectedBranchId || b.code === selectedBranchId);
            if (!branchExists) {
              setSelectedBranchState('ALL');
              updateUrlScope(selectedFranchiseId, 'ALL');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        if (isMounted) setIsLoadingScope(false);
      }
    };

    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedFranchiseId, activeRole, isBranchLocked, isFranchiseLocked, assignedFranchiseId]);

  // Automatically enforce locked roles
  useEffect(() => {
    if (isBranchLocked) {
      if (assignedFranchiseId) setSelectedFranchiseState(assignedFranchiseId);
      if (assignedBranchId) setSelectedBranchState(assignedBranchId);
    } else if (isFranchiseLocked) {
      if (assignedFranchiseId) setSelectedFranchiseState(assignedFranchiseId);
    }
  }, [isBranchLocked, isFranchiseLocked, assignedBranchId, assignedFranchiseId, activeRole]);

  const setSelectedFranchiseId = (id: string | 'ALL') => {
    if (isBranchLocked || isFranchiseLocked) {
      return;
    }
    setSelectedFranchiseState(id);
    setSelectedBranchState('ALL');
    updateUrlScope(id, 'ALL');
  };

  const setSelectedBranchId = (id: string | 'ALL') => {
    if (isBranchLocked) {
      return;
    }
    setSelectedBranchState(id);
    updateUrlScope(selectedFranchiseId, id);
  };

  const resetScope = () => {
    if (isBranchLocked) {
      setSelectedFranchiseState(assignedFranchiseId);
      setSelectedBranchState(assignedBranchId);
      updateUrlScope(assignedFranchiseId, assignedBranchId);
    } else if (isFranchiseLocked) {
      setSelectedFranchiseState(assignedFranchiseId);
      setSelectedBranchState('ALL');
      updateUrlScope(assignedFranchiseId, 'ALL');
    } else {
      setSelectedFranchiseState('ALL');
      setSelectedBranchState('ALL');
      updateUrlScope('ALL', 'ALL');
    }
  };

  // Derive active display names
  const activeFranchise = franchises.find((f) => f.id === selectedFranchiseId);
  const activeBranch = branches.find((b) => b.id === selectedBranchId);

  const activeFranchiseName = isBranchLocked || isFranchiseLocked
    ? assignedFranchiseName || activeFranchise?.name || 'Assigned Franchise'
    : selectedFranchiseId === 'ALL'
    ? 'All Franchises'
    : activeFranchise?.name || selectedFranchiseId;

  const activeBranchName = isBranchLocked
    ? assignedBranchName || activeBranch?.name || 'Assigned Branch'
    : selectedBranchId === 'ALL'
    ? 'All Authorized Branches'
    : activeBranch?.name || selectedBranchId;

  return (
    <ScopeContext.Provider
      value={{
        selectedFranchiseId,
        selectedBranchId,
        isBranchLocked,
        isFranchiseLocked,
        activeBranchName,
        activeFranchiseName,
        franchises,
        branches,
        isLoadingScope,
        setSelectedFranchiseId,
        setSelectedBranchId,
        resetScope,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};
