import { http } from "@/lib/http";
import type { EditorZone, EditorTable, TableStatus } from "../map-editor/map-editor.types";

export async function fetchZones(templateId: string) {
  return http.get<{ success: boolean; data: { branch_name: string; zones: EditorZone[]; table_templates: any[] } }>(`/map-templates/${templateId}/zones`);
}

export async function createZone(templateId: string, name: string, capacity: number) {
  return http.post<{ success: boolean; data: EditorZone }>(`/map-templates/${templateId}/zones`, { name, capacity });
}

export async function updateZoneApi(templateId: string, zoneId: string, name: string, capacity?: number, status?: "OPEN" | "CLOSED") {
  return http.put<{ success: boolean; data: EditorZone }>(`/map-templates/${templateId}/zones/${zoneId}`, { name, capacity, status });
}

export async function deleteZoneApi(templateId: string, zoneId: string) {
  return http.delete<{ success: boolean; message: string }>(`/map-templates/${templateId}/zones/${zoneId}`);
}

export async function createTable(templateId: string, zoneId: string, tableData: Partial<EditorTable>) {
  return http.post<{ success: boolean; data: EditorTable }>(`/map-templates/${templateId}/zones/${zoneId}/tables`, tableData);
}

export async function updateTableApi(templateId: string, zoneId: string, tableId: string, tableData: Partial<EditorTable>) {
  return http.put<{ success: boolean; data: EditorTable }>(`/map-templates/${templateId}/zones/${zoneId}/tables/${tableId}`, tableData);
}

export async function deleteTableApi(templateId: string, zoneId: string, tableId: string) {
  return http.delete<{ success: boolean; message: string }>(`/map-templates/${templateId}/zones/${zoneId}/tables/${tableId}`);
}

export async function bulkUpdateTablesLayout(templateId: string, zoneId: string, tablesData: { _id: string; x: number; y: number }[]) {
  return http.put<{ success: boolean; message: string }>(`/map-templates/${templateId}/zones/${zoneId}/tables/layout`, { tables: tablesData });
}
