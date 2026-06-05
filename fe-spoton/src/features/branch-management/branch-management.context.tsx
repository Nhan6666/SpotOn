"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Branch } from './branch-management.types';
import { MOCK_BRANCHES } from './branch-management.constants';

interface BranchContextType {
  branches: Branch[];
  updateBranch: (id: string, updatedData: Partial<Branch>) => void;
  deactivateBranch: (id: string) => void;
  addBranch: (newBranch: Branch) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);

  const updateBranch = (id: string, updatedData: Partial<Branch>) => {
    setBranches(prev => prev.map(b => b._id === id ? { ...b, ...updatedData } : b));
  };

  const deactivateBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b._id !== id));
  };

  const addBranch = (newBranch: Branch) => {
    setBranches(prev => [newBranch, ...prev]);
  };

  return (
    <BranchContext.Provider value={{ branches, updateBranch, deactivateBranch, addBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
}
