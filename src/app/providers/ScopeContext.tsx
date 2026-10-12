import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types/roles';

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
  activeBranchName: string;
  activeFranchiseName: string;
  setSelectedFranchiseId: (id: string | 'ALL') => void;
  setSelectedBranchId: (id: string | 'ALL') => void;
  resetScope: () => void;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole } = useAuth();
  
  const isBranchLocked = BRANCH_SCOPED_ROLES.includes(activeRole);
  
  const assignedBranchId = user?.assignedBranchId || '';
  const assignedBranchName = user?.assignedBranchName || '';
  const assignedFranchiseId = user?.assignedFranchiseId || '';
  const assignedFranchiseName = user?.assignedFranchiseName || '';

  const [selectedFranchiseId, setSelectedFranchiseState] = useState<string | 'ALL'>(
    isBranchLocked && assignedFranchiseId ? assignedFranchiseId : 'ALL'
  );
  const [selectedBranchId, setSelectedBranchState] = useState<string | 'ALL'>(
    isBranchLocked && assignedBranchId ? assignedBranchId : 'ALL'
  );

  // Automatically sync scope when user or activeRole changes
  useEffect(() => {
    if (isBranchLocked) {
      setSelectedFranchiseState(assignedFranchiseId);
      setSelectedBranchState(assignedBranchId);
    }
  }, [isBranchLocked, assignedBranchId, assignedFranchiseId, activeRole]);

  const setSelectedBranchId = (id: string | 'ALL') => {
    if (isBranchLocked) {
      console.warn(`Branch scope is locked for operational role (${activeRole}). Cannot switch branch.`);
      return; // Ignore branch change for branch-scoped employee
    }
    setSelectedBranchState(id);
  };

  const setSelectedFranchiseId = (id: string | 'ALL') => {
    if (isBranchLocked) {
      console.warn(`Franchise scope is locked for operational role (${activeRole}). Cannot switch franchise.`);
      return;
    }
    setSelectedFranchiseState(id);
  };

  const resetScope = () => {
    if (isBranchLocked) {
      setSelectedFranchiseState(assignedFranchiseId);
      setSelectedBranchState(assignedBranchId);
    } else {
      setSelectedFranchiseState('ALL');
      setSelectedBranchState('ALL');
    }
  };

  return (
    <ScopeContext.Provider
      value={{
        selectedFranchiseId,
        selectedBranchId,
        isBranchLocked,
        activeBranchName: isBranchLocked ? assignedBranchName : selectedBranchId === 'ALL' ? 'All Branches' : assignedBranchName,
        activeFranchiseName: isBranchLocked ? assignedFranchiseName : selectedFranchiseId === 'ALL' ? 'Ashok Leyland Franchises' : assignedFranchiseName,
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

