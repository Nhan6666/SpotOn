import { http } from '@/lib/http';
import { TableStatus } from '../map-editor/map-editor.types';

export async function updateTableStatus(branchId: string, zoneId: string, tableId: string, status: TableStatus) {
  const response = await http.put(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`, {
    status
  });
  return response;
}

export async function updateZoneStatus(branchId: string, zoneId: string, status: 'OPEN' | 'CLOSED') {
  const response = await http.put(`/branches/${branchId}/zones/${zoneId}`, {
    status
  });
  return response;
}

export async function updateBranchStatus(branchId: string, status: 'OPEN' | 'FULL' | 'CLOSED') {
  const response = await http.put(`/branches/${branchId}`, { status });
  return response;
}
