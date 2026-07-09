"use client";

import React, { useState, useEffect } from "react";
import { fetchBranchMapData } from "../../booking/booking.service";
import { updateTableStatus, updateZoneStatus, updateBranchStatus } from "./live-map.service";
import { MapViewer } from "../../booking/components/MapViewer";
import type { EditorZone, TableStatus } from "../map-editor/map-editor.types";
import type { TableData } from "../../booking/components/TableShape";
import { TABLE_STATUS_CONFIG } from "../map-editor/map-editor.types";
import { Loader2, X, RefreshCw, Power } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

interface LiveMapFeatureProps {
  branchId: string;
}

export function LiveMapFeature({ branchId }: LiveMapFeatureProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [zones, setZones] = useState<EditorZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchStatus, setBranchStatus] = useState<"OPEN" | "FULL" | "CLOSED">("OPEN");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadMap = async () => {
    try {
      setIsLoading(true);
      const res = await fetchBranchMapData(branchId);
      if (res.success && res.data) {
        setBranchName(res.data.branch_name);
        setBranchStatus(res.data.branch_status as any || "OPEN");
        setZones(res.data.zones || []);
        if (res.data.zones && res.data.zones.length > 0 && !selectedZoneId) {
          setSelectedZoneId(res.data.zones[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch map data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
  }, [branchId]);

  const handleStatusChange = async (newStatus: TableStatus) => {
    if (!selectedZoneId || !selectedTableId) return;
    try {
      setIsUpdating(true);
      const res = await updateTableStatus(branchId, selectedZoneId, selectedTableId, newStatus);
      if ((res as any).success) {
        // Optimistically update local state
        setZones(prev => prev.map(zone => {
          if (zone._id !== selectedZoneId) return zone;
          return {
            ...zone,
            tables: zone.tables.map(table => {
              if (table._id !== selectedTableId) return table;
              return { ...table, status: newStatus };
            })
          };
        }));
        setSelectedTableId(null); // Close modal
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleZoneStatusToggle = async () => {
    if (!selectedZoneId) return;
    const currentZone = zones.find(z => z._id === selectedZoneId);
    if (!currentZone) return;

    const newStatus = currentZone.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    try {
      setIsUpdating(true);
      const res = await updateZoneStatus(branchId, selectedZoneId, newStatus);
      if ((res as any).success) {
        setZones(prev => prev.map(zone => {
          if (zone._id !== selectedZoneId) return zone;
          return { ...zone, status: newStatus };
        }));
      }
    } catch (err) {
      console.error("Failed to update zone status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBranchStatusToggle = async () => {
    const newStatus = branchStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    try {
      setIsUpdating(true);
      const res = await updateBranchStatus(branchId, newStatus);
      if ((res as any).success) {
        setBranchStatus(newStatus);
      }
    } catch (err) {
      console.error("Failed to update branch status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedZone = zones.find(z => z._id === selectedZoneId);
  const tables: TableData[] = selectedZone ? selectedZone.tables.map(t => ({
    id: t._id,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    capacity: t.capacity,
    status: t.status,
    shape: t.shape,
    table_number: t.table_number,
    image_url: t.image_url
  })) : [];

  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="flex flex-col min-h-[800px] h-[calc(100vh-4rem)] bg-gray-50 relative">
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            Live Map: {branchName}
            {branchStatus === 'CLOSED' && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 uppercase">Tạm đóng</span>
            )}
          </h1>
          <p className="text-sm text-gray-500">Update physical table status in real-time</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Hoạt động quán:</span>
              <button
                onClick={handleBranchStatusToggle}
                disabled={isUpdating}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  branchStatus === 'CLOSED' 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Power className="w-3 h-3" />
                {branchStatus === 'CLOSED' ? 'ĐANG ĐÓNG' : 'ĐANG MỞ'}
              </button>
            </div>
          )}

          <button 
            onClick={loadMap} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Zone Selector Tabs & Status Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          {zones.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {zones.map((zone) => (
                <button
                  key={zone._id}
                  onClick={() => setSelectedZoneId(zone._id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
                    selectedZoneId === zone._id
                      ? "bg-blue-600 text-white shadow-blue-500/30"
                      : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                  }`}
                >
                  {zone.name}
                  {zone.status === 'CLOSED' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] uppercase">Đóng</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isAdmin && selectedZone && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
              <span className="text-sm font-medium text-gray-700">Trạng thái khu vực:</span>
              <button
                onClick={handleZoneStatusToggle}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  selectedZone.status === 'CLOSED' 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Power className="w-4 h-4" />
                {selectedZone.status === 'CLOSED' ? 'ĐANG ĐÓNG' : 'ĐANG MỞ'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col relative">
          <MapViewer
            tables={tables}
            isLoading={isLoading}
            selectedTableId={selectedTableId}
            onSelectTable={(id) => {
              if (isAdmin) return;
              setSelectedTableId(prev => prev === id ? null : id);
            }}
            allowAllStatuses={true} // Allow clicking any table regardless of status
          />

          {/* Status Update Modal */}
          {selectedTable && !isAdmin && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-900">
                    Bàn số {selectedTable.table_number || "..."}
                  </h3>
                  <button 
                    onClick={() => setSelectedTableId(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Cập nhật trạng thái</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(TABLE_STATUS_CONFIG) as TableStatus[]).map((status) => {
                      const config = TABLE_STATUS_CONFIG[status];
                      const isCurrent = selectedTable.status === status;
                      return (
                        <button
                          key={status}
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(status)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            isCurrent 
                              ? `${config.bg} ${config.border} ring-2 ring-offset-1 ring-${config.border.split('-')[1]}-400`
                              : `bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50`
                          } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isUpdating && isCurrent ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className={`w-2.5 h-2.5 rounded-full ${config.border.replace('border-', 'bg-')}`} />
                          )}
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
