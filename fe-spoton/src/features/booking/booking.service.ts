import { http } from '@/lib/http';
import type { EditorZone, SingleResponse } from '../admin/map-editor/map-editor.types';

const BASE = '/branches';

export async function fetchBranchMapData(branchId: string) {
  const response = await http.get<SingleResponse<{ branch_name: string; branch_address: string; branch_status: string; zones: EditorZone[] }>>(`${BASE}/${branchId}/zones`);
  return response;
}
