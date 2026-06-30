import { http } from '@/lib/http';
import type { EditorZone, EditorTable, ZonesResponse, SingleResponse } from './map-editor.types';

const BASE = '/branches';

// =============================================
// ZONE API
// =============================================

export async function fetchZones(branchId: string) {
  const response = await http.get<SingleResponse<{ branch_name: string; zones: EditorZone[]; table_templates: any[] }>>(`${BASE}/${branchId}/zones`);
  return response;
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
  data: { table_number: string; capacity: number; x?: number; y?: number; width?: number; height?: number; shape?: string; image_url?: string | null }
) {
  return http.post<SingleResponse<EditorTable>>(`${BASE}/${branchId}/zones/${zoneId}/tables`, data);
}

export async function updateTableApi(
  branchId: string,
  zoneId: string,
  tableId: string,
  data: { table_number?: string; capacity?: number; status?: string; x?: number; y?: number; width?: number; height?: number; shape?: string; image_url?: string | null }
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

export async function uploadTableImageApi(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  // Do NOT set Content-Type to multipart/form-data manually.
  // The browser needs to set it automatically with the boundary string.
  return http.post<SingleResponse<{ url: string; filename: string }>>('/uploads/table', formData);
}

export async function updateTableTemplateApi(
  branchId: string,
  templateIndex: number,
  data: { image_url: string | null }
) {
  return http.put<SingleResponse<any>>(`${BASE}/${branchId}/templates/${templateIndex}`, data);
}

export async function applyTemplateApi(branchId: string, zoneId: string, templateId: string) {
  return http.post<SingleResponse<any>>(`${BASE}/${branchId}/zones/${zoneId}/apply-template`, { templateId });
}
