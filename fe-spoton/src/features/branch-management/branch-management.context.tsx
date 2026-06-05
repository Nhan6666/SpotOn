"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { http } from '@/lib/http';
import { Branch } from './branch-management.types';

const ENDPOINT = '/branches';

interface BranchContextType {
  branches: Branch[];
  isLoading: boolean;
  updateBranch: (id: string, updatedData: Partial<Branch>) => Promise<void>;
  deactivateBranch: (id: string) => Promise<void>;
  addBranch: (newBranch: Partial<Branch>) => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const branches = await http.get<Branch[]>(ENDPOINT);
      if (branches && Array.isArray(branches)) {
        setBranches(branches);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const updateBranch = async (id: string, updatedData: Partial<Branch>) => {
    try {
      const updated = await http.put<Branch>(`${ENDPOINT}/${id}`, updatedData);
      if (updated) {
        setBranches(prev => prev.map(b => b._id === id ? updated : b));
      }
    } catch (error) {
      console.error('Failed to update branch:', error);
      throw error;
    }
  };

  const deactivateBranch = async (id: string) => {
    try {
      await http.delete(`${ENDPOINT}/${id}`);
      setBranches(prev => prev.filter(b => b._id !== id));
    } catch (error) {
      console.error('Failed to deactivate branch:', error);
      throw error;
    }
  };

  const addBranch = async (newBranch: Partial<Branch>) => {
    try {
      const created = await http.post<Branch>(ENDPOINT, newBranch);
      if (created) {
        setBranches(prev => [created, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw error;
    }
  };

  return (
    <BranchContext.Provider value={{ 
      branches, 
      isLoading, 
      updateBranch, 
      deactivateBranch, 
      addBranch, 
      refreshBranches: fetchBranches 
    }}>
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

