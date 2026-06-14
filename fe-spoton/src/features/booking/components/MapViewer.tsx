import React, { useState, useRef, MouseEvent, WheelEvent } from "react";
import { ZoomIn, ZoomOut, RefreshCcw, Info } from "lucide-react";
import { TableShape, TableData } from "./TableShape";
import { CapacityFilter } from "../types";

// Mock data matching the design structure
const MOCK_TABLES: TableData[] = [
  // 2-person tables (Blue/Available)
  {
    id: "1",
    x: 50,
    y: 80,
    width: 70,
    height: 70,
    capacity: 2,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "2",
    x: 200,
    y: 80,
    width: 70,
    height: 70,
    capacity: 2,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "3",
    x: 350,
    y: 80,
    width: 70,
    height: 70,
    capacity: 2,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "4",
    x: 500,
    y: 80,
    width: 70,
    height: 70,
    capacity: 2,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "5",
    x: 650,
    y: 80,
    width: 70,
    height: 70,
    capacity: 2,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },

  // 2/4-person tables row 2
  {
    id: "6",
    x: 50,
    y: 280,
    width: 90,
    height: 90,
    capacity: 4,
    status: "RESERVED",
    shape: "RECTANGLE",
  },
  {
    id: "7",
    x: 230,
    y: 280,
    width: 90,
    height: 90,
    capacity: 4,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "8",
    x: 410,
    y: 280,
    width: 90,
    height: 90,
    capacity: 4,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  }, // Will be selected in UI
  {
    id: "9",
    x: 590,
    y: 280,
    width: 90,
    height: 90,
    capacity: 4,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },

  // Big 8-person tables at the bottom
  {
    id: "10",
    x: 150,
    y: 530,
    width: 160,
    height: 90,
    capacity: 8,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },
  {
    id: "11",
    x: 400,
    y: 530,
    width: 160,
    height: 90,
    capacity: 8,
    status: "AVAILABLE",
    shape: "RECTANGLE",
  },

  // Circle tables on the right
  {
    id: "12",
    x: 700,
    y: 380,
    width: 100,
    height: 100,
    capacity: 8,
    status: "AVAILABLE",
    shape: "CIRCLE",
  },
  {
    id: "13",
    x: 700,
    y: 530,
    width: 100,
    height: 100,
    capacity: 8,
    status: "RESERVED",
    shape: "CIRCLE",
  },
];

interface MapViewerProps {
  selectedCapacity: CapacityFilter;
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
}

export function MapViewer({
  selectedCapacity,
  selectedTableId,
  onSelectTable,
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

        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-700">Bàn trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span className="text-sm text-gray-700">Bàn đã đặt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-700">Bàn đang chọn</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#fafafa] flex items-center justify-center p-4 overflow-hidden">
        {/* Responsive wrapper to hold the scaled canvas without causing scrollbars */}
        <div
          style={{ width: 850 * 0.75, height: 700 * 0.75 }}
          className="relative"
        >
          {/* The Map Canvas with a fixed scale */}
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: "850px",
              height: "700px",
              transform: "scale(0.75)",
            }}
          >
            {/* Static Floor Elements (Walls, doors etc based on design) */}
            <div className="absolute top-[10px] left-[50px] w-[200px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
              KHU VỰC PHỤC VỤ
            </div>

            <div className="absolute top-[30px] left-[350px] w-[350px] h-[30px] bg-gray-300 rounded-lg flex items-center justify-evenly">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            </div>

            {/* Distance Annotations (Mock) */}
            <div className="absolute top-[110px] left-[140px] text-[10px] text-teal-600 font-bold flex items-center">
              <span className="mr-1">↔</span> 60 cm
            </div>
            <div className="absolute top-[110px] left-[290px] text-[10px] text-teal-600 font-bold flex items-center">
              <span className="mr-1">↔</span> 90 - 110 cm
            </div>
            <div className="absolute top-[430px] left-[400px] text-[10px] text-teal-600 font-bold flex items-center">
              <span className="mr-1">↕</span> 120 - 150 cm
            </div>

            {/* Render Tables */}
            {MOCK_TABLES.map((table) => {
              const isDisabled =
                selectedCapacity !== null &&
                table.capacity !== selectedCapacity;
              return (
                <TableShape
                  key={table.id}
                  table={table}
                  isSelected={selectedTableId === table.id}
                  isDisabled={isDisabled}
                  onSelect={onSelectTable}
                />
              );
            })}

            {/* Entrance Label */}
            <div className="absolute bottom-[20px] left-[480px] text-blue-600 font-bold text-sm tracking-wider flex items-center flex-col">
              <span>↑ LỐI VÀO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
