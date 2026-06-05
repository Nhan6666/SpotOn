"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Branch } from './branch-management.types';

const API_URL = '/api/v1/branches';

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
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const updateBranch = async (id: string, updatedData: Partial<Branch>) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (result.success) {
        setBranches(prev => prev.map(b => b._id === id ? { ...b, ...result.data } : b));
      }
    } catch (error) {
      console.error('Failed to update branch:', error);
      throw error;
    }
  };

  const deactivateBranch = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setBranches(prev => prev.filter(b => b._id !== id));
      }
    } catch (error) {
      console.error('Failed to deactivate branch:', error);
      throw error;
    }
  };

  const addBranch = async (newBranch: Partial<Branch>) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
      });
      const result = await response.json();
      if (result.success) {
        setBranches(prev => [result.data, ...prev]);
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

