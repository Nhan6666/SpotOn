"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { http } from '@/lib/http';
import { Branch } from './branch-management.types';

const ENDPOINT = '/branches';

// Shape của tất cả API response từ BE: { success, count?, data }
interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
}

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

  // fetchBranches không gọi setIsLoading(true) để tránh synchronous setState trong effect
  const fetchBranches = async () => {
    try {
      // BE trả về { success, count, data: Branch[] } — phải lấy .data
      const res = await http.get<ApiListResponse<Branch>>(ENDPOINT);
      if (res?.data && Array.isArray(res.data)) {
        setBranches(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  // refreshBranches được gọi bởi user action (không phải effect) nên có thể set loading
  const refreshBranches = async () => {
    setIsLoading(true);
    await fetchBranches();
  };

  useEffect(() => {
    let cancelled = false;
    // Dùng async IIFE để linter thấy rõ async boundary — setState chỉ chạy sau await
    (async () => {
      try {
        const res = await http.get<ApiListResponse<Branch>>(ENDPOINT);
        if (!cancelled && res?.data && Array.isArray(res.data)) {
          setBranches(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        if (!cancelled) setBranches([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateBranch = async (id: string, updatedData: Partial<Branch>) => {
    try {
      // BE trả về { success, data: Branch }
      const res = await http.put<ApiSingleResponse<Branch>>(`${ENDPOINT}/${id}`, updatedData);
      if (res?.data) {
        setBranches(prev => prev.map(b => b._id === id ? res.data : b));
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
      // BE trả về { success, data: Branch }
      const res = await http.post<ApiSingleResponse<Branch>>(ENDPOINT, newBranch);
      if (res?.data) {
        setBranches(prev => [res.data, ...prev]);
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

