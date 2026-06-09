"use client";

import React, { useState } from "react";
import { MapSidebar } from "./components/MapSidebar";
import { MapViewer } from "./components/MapViewer";
import { MapBottomBar } from "./components/MapBottomBar";

interface TableMapFeatureProps {
  branchId: string;
}

import { CapacityFilter } from "./types";
export function TableMapFeature({ branchId }: TableMapFeatureProps) {
  const [selectedCapacity, setSelectedCapacity] =
    useState<CapacityFilter>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // In a real app, we would fetch branch layout and tables based on branchId here
  const liveOccupancy = 68; // Mock value

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50 relative">
      <div className="flex flex-1 flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 gap-6 mb-20">
        {/* Sidebar Left */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          <MapSidebar
            branchId={branchId}
            selectedCapacity={selectedCapacity}
            onCapacitySelect={setSelectedCapacity}
            liveOccupancy={liveOccupancy}
          />
        </div>

        {/* Main Map Viewer */}
        <div className="flex-1 bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col">
          <MapViewer
            selectedCapacity={selectedCapacity}
            selectedTableId={selectedTableId}
            onSelectTable={(id) =>
              setSelectedTableId((prev) => (prev === id ? null : id))
            }
          />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <MapBottomBar selectedTableId={selectedTableId} />
    </div>
  );
}
