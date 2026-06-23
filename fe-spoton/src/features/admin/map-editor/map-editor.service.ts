import { http } from '@/lib/http';
import type { EditorZone, EditorTable, ZonesResponse, SingleResponse } from './map-editor.types';

const BASE = '/branches';

// =============================================
// ZONE API
// =============================================

export async function fetchZones(branchId: string) {
  return http.get<ZonesResponse>(`${BASE}/${branchId}/zones`);
}

export async function createZone(branchId: string, data: { name: string; capacity: number }) {
  return http.post<SingleResponse<EditorZone>>(`${BASE}/${branchId}/zones`, data);
}

export async function updateZoneApi(branchId: string, zoneId: string, data: { name?: string; capacity?: number }) {
  return http.put<SingleResponse<EditorZone>>(`${BASE}/${branchId}/zones/${zoneId}`, data);
}

export async function deleteZoneApi(branchId: string, zoneId: string) {
  return http.delete<SingleResponse<Record<string, never>>>(`${BASE}/${branchId}/zones/${zoneId}`);
}

// =============================================
// TABLE API
// =============================================

export async function createTable(
  branchId: string, 
  zoneId: string, 
  data: { table_number: string; capacity: number; x?: number; y?: number; width?: number; height?: number; shape?: string }
) {
  return http.post<SingleResponse<EditorTable>>(`${BASE}/${branchId}/zones/${zoneId}/tables`, data);
}

export async function updateTableApi(
  branchId: string,
  zoneId: string,
  tableId: string,
  data: { table_number?: string; capacity?: number; status?: string; x?: number; y?: number; width?: number; height?: number; shape?: string }
) {
  return http.put<SingleResponse<EditorTable>>(`${BASE}/${branchId}/zones/${zoneId}/tables/${tableId}`, data);
}

export async function deleteTableApi(branchId: string, zoneId: string, tableId: string) {
  return http.delete<SingleResponse<Record<string, never>>>(`${BASE}/${branchId}/zones/${zoneId}/tables/${tableId}`);
}

export async function bulkUpdateTablesLayout(
  branchId: string,
  zoneId: string,
  tables: { _id: string; x: number; y: number }[]
) {
  return http.put<SingleResponse<EditorTable[]>>(`${BASE}/${branchId}/zones/${zoneId}/tables/layout`, { tables });
}
