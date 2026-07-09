import React, { useState, useRef, MouseEvent, WheelEvent } from "react";
import { ZoomIn, ZoomOut, RefreshCcw, Info, Loader2 } from "lucide-react";
import { TableShape, TableData } from "./TableShape";
import { CapacityFilter } from "../types";
import { TABLE_STATUS_CONFIG } from "../../admin/map-editor/map-editor.types";

interface MapViewerProps {
  tables: TableData[];
  isLoading: boolean;
  selectedCapacity?: CapacityFilter;
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  allowAllStatuses?: boolean;
}

export function MapViewer({
  tables,
  isLoading,
  selectedCapacity = null,
  selectedTableId,
  onSelectTable,
  allowAllStatuses,
}: MapViewerProps) {
  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-100 bg-white z-20 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            SƠ ĐỒ BÀN QUÁN ĂN
          </h2>
          <p className="text-sm text-gray-500">Chọn bàn theo số lượng khách</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
          {Object.values(TABLE_STATUS_CONFIG).map((config, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${config.bg} ${config.border}`}></div>
              <span className="text-xs text-gray-700">{config.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-4">
            <div className="w-3 h-3 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <span className="text-xs font-semibold text-gray-900">Đang chọn</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#f8fafc] overflow-auto">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]" style={{ backgroundSize: '16px 16px' }} />
        
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Đang tải sơ đồ bàn...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <Info className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Chưa có bàn nào trong khu vực này</p>
          </div>
        ) : (
          <div className="relative min-w-[2000px] min-h-[1500px] p-10">
            {tables.map((table) => {
              const isDisabled = selectedCapacity !== null && table.capacity !== selectedCapacity;
              return (
                <TableShape
                  key={table.id}
                  table={table}
                  isSelected={selectedTableId === table.id}
                  isDisabled={isDisabled}
                  onSelect={onSelectTable}
                  allowAllStatuses={allowAllStatuses}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
