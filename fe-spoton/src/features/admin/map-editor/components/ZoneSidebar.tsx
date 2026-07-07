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
import { ADMIN_TEXTS } from "@/constants/texts/admin";

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
    <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 self-start sticky top-6">
      {/* Stats */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{ADMIN_TEXTS.mapEditor.sidebarOverviewTitle}</h3>
            <p className="text-xs text-gray-500">{ADMIN_TEXTS.mapEditor.sidebarOverviewSubtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-amber-700">{zones.length}</div>
            <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">{ADMIN_TEXTS.mapEditor.sidebarStatZones}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{totalTables}</div>
            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{ADMIN_TEXTS.mapEditor.sidebarStatTables}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-700">{emptyTables}</div>
            <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">{ADMIN_TEXTS.mapEditor.sidebarStatEmpty}</div>
          </div>
        </div>
      </div>

      {/* Zone List */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">
            {ADMIN_TEXTS.mapEditor.sidebarListTitle}
          </h3>
          <Button
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 shadow-md hover:shadow-lg transition-all duration-300 border-0 text-xs px-3 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={onAddZone}
            aria-label={ADMIN_TEXTS.mapEditor.sidebarBtnAdd}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {ADMIN_TEXTS.mapEditor.sidebarBtnAdd}
          </Button>
        </div>

        <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">{ADMIN_TEXTS.mapEditor.sidebarLoading}</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{ADMIN_TEXTS.mapEditor.sidebarEmptyList}</p>
              <p className="text-xs text-gray-400">{ADMIN_TEXTS.mapEditor.sidebarEmptyHint}</p>
            </div>
          ) : (
            zones.map((zone) => {
              const isExpanded = expandedZones.has(zone._id);
              const isSelected = selectedZoneId === zone._id;

              return (
                <div key={zone._id} className="px-2 py-1">
                  {/* Zone Header */}
                  <div
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ease-out group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isSelected
                        ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100/50 scale-[1.02]"
                        : "hover:bg-white/60 hover:shadow-sm border border-transparent hover:-translate-y-0.5"
                    }`}
                    onClick={() => {
                      onSelectZone(zone._id);
                      if (!isExpanded) toggleExpand(zone._id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectZone(zone._id);
                        if (!isExpanded) toggleExpand(zone._id);
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-label={isExpanded ? ADMIN_TEXTS.mapEditor.sidebarCollapseArea : ADMIN_TEXTS.mapEditor.sidebarExpandArea}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(zone._id);
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0 p-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {zone.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {zone.tables.length} {ADMIN_TEXTS.mapEditor.sidebarTableUnit}
                        {zone.capacity > 0 && ` · ${zone.capacity} ${ADMIN_TEXTS.mapEditor.sidebarSeatUnit}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label={`${ADMIN_TEXTS.mapEditor.sidebarEditArea} ${zone.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditZone(zone);
                        }}
                        className="p-1.5 rounded-md hover:bg-amber-100 text-gray-400 hover:text-amber-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        title={ADMIN_TEXTS.mapEditor.sidebarEditArea}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`${ADMIN_TEXTS.mapEditor.sidebarDeleteArea} ${zone.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteZone(zone);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        title={ADMIN_TEXTS.mapEditor.sidebarDeleteArea}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Table preview list */}
                  {isExpanded && zone.tables.length > 0 && (
                    <div className="px-4 pb-3 pl-12 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="space-y-1.5">
                        {zone.tables.map((table) => (
                          <div
                            key={table._id}
                            className="flex items-center gap-2 text-xs text-gray-500 py-1 transition-colors hover:text-gray-900"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                            <span className="font-medium">{ADMIN_TEXTS.mapEditor.sidebarTableUnit} {table.table_number}</span>
                            <span className="text-gray-400">· {table.capacity} {ADMIN_TEXTS.mapEditor.sidebarSeatUnit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && zone.tables.length === 0 && (
                    <div className="px-4 pb-3 pl-12 animate-in slide-in-from-top-2 fade-in duration-300">
                      <p className="text-xs text-gray-400 italic">{ADMIN_TEXTS.mapEditor.sidebarNoTable}</p>
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
