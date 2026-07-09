"use client";

import React, { useState, useEffect } from "react";
import { MapSidebar } from "./components/MapSidebar";
import { MapViewer } from "./components/MapViewer";
import { MapBottomBar } from "./components/MapBottomBar";
import { CapacityFilter } from "./types";
import { fetchBranchMapData } from "./booking.service";
import type { EditorZone } from "../admin/map-editor/map-editor.types";
import type { TableData } from "./components/TableShape";
import { Lock } from "lucide-react";

interface TableMapFeatureProps {
  branchId: string;
}

export function TableMapFeature({ branchId }: TableMapFeatureProps) {
  const [selectedCapacity, setSelectedCapacity] = useState<CapacityFilter>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  const [zones, setZones] = useState<EditorZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchStatus, setBranchStatus] = useState<"OPEN" | "FULL" | "CLOSED">("OPEN");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadMap = async () => {
      try {
        setIsLoading(true);
        const res = await fetchBranchMapData(branchId);
        if (res.success && res.data) {
          if (mounted) {
            setBranchName(res.data.branch_name);
            setBranchAddress(res.data.branch_address);
            setBranchStatus(res.data.branch_status as any || "OPEN");
            setZones(res.data.zones || []);
            if (res.data.zones && res.data.zones.length > 0) {
              setSelectedZoneId(res.data.zones[0]._id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch map data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadMap();
    return () => { mounted = false; };
  }, [branchId]);

  const liveOccupancy = 68; // Mock value

  // Get tables for selected zone
  const selectedZone = zones.find(z => z._id === selectedZoneId);
  const tables: TableData[] = selectedZone ? selectedZone.tables.map(t => ({
    id: t._id,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    capacity: t.capacity,
    status: t.status as any,
    shape: t.shape,
    table_number: t.table_number,
    image_url: t.image_url
  })) : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50 relative">
      <div className="flex flex-1 flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 gap-6 mb-20">
        {/* Sidebar Left */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          <MapSidebar
            branchId={branchId}
            branchName={branchName}
            branchAddress={branchAddress}
            selectedCapacity={selectedCapacity}
            onCapacitySelect={setSelectedCapacity}
            liveOccupancy={liveOccupancy}
          />
        </div>

        {/* Main Map Viewer */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Zone Selector Tabs */}
          {zones.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {zones.map((zone) => (
                <button
                  key={zone._id}
                  onClick={() => setSelectedZoneId(zone._id)}
                  className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
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

          <div className="flex-1 bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col">
            {branchStatus === 'CLOSED' ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Quán đang đóng cửa</h3>
                <p className="text-gray-500 max-w-md">
                  Rất xin lỗi, chi nhánh <strong>{branchName}</strong> hiện đang tạm dừng nhận khách. Quý khách vui lòng quay lại sau hoặc chọn chi nhánh khác!
                </p>
              </div>
            ) : selectedZone?.status === 'CLOSED' ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Khu vực đang tạm đóng</h3>
                <p className="text-gray-500 max-w-md">
                  Khu vực này hiện đang tạm thời đóng cửa (do thời tiết hoặc đang bảo trì). Vui lòng chọn một khu vực khác để tiếp tục đặt bàn.
                </p>
              </div>
            ) : (
              <MapViewer
                tables={tables}
                isLoading={isLoading}
                selectedCapacity={selectedCapacity}
                selectedTableId={selectedTableId}
                onSelectTable={(id) =>
                  setSelectedTableId((prev) => (prev === id ? null : id))
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <MapBottomBar 
        selectedTableId={selectedTableId} 
        selectedTableNumber={tables.find(t => t.id === selectedTableId)?.table_number}
      />
    </div>
  );
}
