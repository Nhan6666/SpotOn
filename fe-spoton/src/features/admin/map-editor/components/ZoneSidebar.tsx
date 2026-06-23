"use client";

import React, { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Layers,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EditorZone } from "../map-editor.types";

interface ZoneSidebarProps {
  zones: EditorZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onAddZone: () => void;
  onEditZone: (zone: EditorZone) => void;
  onDeleteZone: (zone: EditorZone) => void;
  isLoading: boolean;
}

export function ZoneSidebar({
  zones,
  selectedZoneId,
  onSelectZone,
  onAddZone,
  onEditZone,
  onDeleteZone,
  isLoading,
}: ZoneSidebarProps) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  const toggleExpand = (zoneId: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const totalTables = zones.reduce((acc, z) => acc + z.tables.length, 0);
  const emptyTables = zones.reduce(
    (acc, z) => acc + z.tables.filter((t) => t.status === "EMPTY").length,
    0
  );

  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Tổng Quan</h3>
            <p className="text-xs text-gray-500">Sơ đồ bàn chi nhánh</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-amber-700">{zones.length}</div>
            <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Khu vực</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{totalTables}</div>
            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Tổng bàn</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-700">{emptyTables}</div>
            <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Còn trống</div>
          </div>
        </div>
      </div>

      {/* Zone List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">
            Danh sách khu vực
          </h3>
          <Button
            variant="primary"
            size="sm"
            className="bg-amber-700 hover:bg-amber-800 border-0 text-xs px-3"
            onClick={onAddZone}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm
          </Button>
        </div>

        <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Đang tải...</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Chưa có khu vực nào</p>
              <p className="text-xs text-gray-400">Nhấn &quot;Thêm&quot; để tạo khu vực đầu tiên</p>
            </div>
          ) : (
            zones.map((zone) => {
              const isExpanded = expandedZones.has(zone._id);
              const isSelected = selectedZoneId === zone._id;

              return (
                <div key={zone._id} className="border-b border-gray-100 last:border-b-0">
                  {/* Zone Header */}
                  <div
                    className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-all group ${
                      isSelected
                        ? "bg-amber-50 border-l-4 border-amber-600"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                    onClick={() => {
                      onSelectZone(zone._id);
                      if (!isExpanded) toggleExpand(zone._id);
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(zone._id);
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {zone.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {zone.tables.length} bàn
                        {zone.capacity > 0 && ` · ${zone.capacity} chỗ`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditZone(zone);
                        }}
                        className="p-1.5 rounded-md hover:bg-amber-100 text-gray-400 hover:text-amber-700 transition-colors"
                        title="Sửa khu vực"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteZone(zone);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        title="Xóa khu vực"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Table preview list */}
                  {isExpanded && zone.tables.length > 0 && (
                    <div className="bg-gray-50/70 px-4 pb-3 pl-10">
                      <div className="space-y-1">
                        {zone.tables.map((table) => (
                          <div
                            key={table._id}
                            className="flex items-center gap-2 text-xs text-gray-600 py-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            <span className="font-medium">Bàn {table.table_number}</span>
                            <span className="text-gray-400">· {table.capacity} chỗ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && zone.tables.length === 0 && (
                    <div className="bg-gray-50/70 px-4 pb-3 pl-10">
                      <p className="text-xs text-gray-400 italic">Chưa có bàn nào</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
