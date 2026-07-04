import { http } from '@/lib/http';

const BASE = '/map-templates';

export async function fetchMapTemplates() {
  return http.get<{ success: boolean; data: any[] }>(BASE);
}

export async function createMapTemplate(data: { name: string; description?: string }) {
  return http.post<{ success: boolean; data: any }>(BASE, data);
}

export async function updateMapTemplate(id: string, data: { name: string; description?: string }) {
  return http.put<{ success: boolean; data: any }>(`${BASE}/${id}`, data);
}

export async function deleteMapTemplate(id: string) {
  return http.delete<{ success: boolean; message: string }>(`${BASE}/${id}`);
}
