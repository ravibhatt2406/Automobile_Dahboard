import React, { createContext, useContext, useState } from 'react';

interface ScopeContextType {
  selectedFranchiseId: string | 'ALL';
  selectedBranchId: string | 'ALL';
  setSelectedFranchiseId: (id: string | 'ALL') => void;
  setSelectedBranchId: (id: string | 'ALL') => void;
  resetScope: () => void;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | 'ALL'>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string | 'ALL'>('ALL');

  const resetScope = () => {
    setSelectedFranchiseId('ALL');
    setSelectedBranchId('ALL');
  };

  return (
    <ScopeContext.Provider
      value={{
        selectedFranchiseId,
        selectedBranchId,
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
