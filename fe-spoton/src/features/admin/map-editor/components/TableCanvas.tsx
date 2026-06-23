"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Save, Undo2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EditorTable, EditorZone } from "../map-editor.types";
import { TABLE_STATUS_CONFIG } from "../map-editor.types";

interface TableCanvasProps {
  zone: EditorZone | null;
  onAddTable: () => void;
  onEditTable: (table: EditorTable) => void;
  onSaveLayout: (tables: { _id: string; x: number; y: number }[]) => Promise<void>;
}

export function TableCanvas({ zone, onAddTable, onEditTable, onSaveLayout }: TableCanvasProps) {
  const [tables, setTables] = useState<EditorTable[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync tables from props when zone changes or saved
  useEffect(() => {
    if (zone) {
      setTables(JSON.parse(JSON.stringify(zone.tables)));
      setHasChanges(false);
    } else {
      setTables([]);
    }
  }, [zone]);

  // Handle global mouse up to stop dragging if mouse leaves canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDraggedTableId(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  if (!zone) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-700 mb-1">Chọn khu vực</h3>
          <p className="text-sm text-gray-400">
            Chọn một khu vực từ sidebar bên trái để sắp xếp bàn
          </p>
        </div>
      </div>
    );
  }

  // --- Drag and Drop Logic ---
  const handleMouseDown = (e: React.MouseEvent, table: EditorTable) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    // If clicking on edit button, don't drag
    if ((e.target as HTMLElement).closest('.edit-btn')) {
      return;
    }

    setIsDragging(true);
    setDraggedTableId(table._id);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      // Scale compensation (if canvas is scaled down via CSS transform)
      // Currently using scale(1) or scale(0.8) depending on screen, we need to account for it
      // For simplicity, let's assume no scaling in edit mode, or we calculate exact offset
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;
      
      setDragOffset({
        x: mouseX - (table.x || 0),
        y: mouseY - (table.y || 0)
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedTableId) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      let newX = e.clientX - canvasRect.left - dragOffset.x;
      let newY = e.clientY - canvasRect.top - dragOffset.y;

      // Snap to 10px grid
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;

      const targetTable = tables.find(t => t._id === draggedTableId);
      const tWidth = targetTable?.width || 70;
      const tHeight = targetTable?.height || 70;

      // Boundary check (assume canvas is 850x700)
      newX = Math.max(0, Math.min(newX, 850 - tWidth));
      newY = Math.max(0, Math.min(newY, 700 - tHeight));

      setTables(prev => prev.map(t => 
        t._id === draggedTableId ? { ...t, x: newX, y: newY } : t
      ));
      setHasChanges(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedTableId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const layoutData = tables.map(t => ({ _id: t._id, x: t.x || 0, y: t.y || 0 }));
      await onSaveLayout(layoutData);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    setTables(JSON.parse(JSON.stringify(zone.tables)));
    setHasChanges(false);
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{zone.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {tables.length} bàn
              {zone.capacity > 0 && ` · Sức chứa: ${zone.capacity} người`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={isSaving}>
                  <Undo2 className="w-4 h-4 mr-1.5" />
                  Hủy thay đổi
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 border-0"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSaving ? "Đang lưu..." : "Lưu Sơ Đồ"}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 ml-2"
              onClick={onAddTable}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm bàn
            </Button>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {(Object.entries(TABLE_STATUS_CONFIG) as [string, { label: string; color: string; bg: string; border: string }][]).map(
            ([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${config.bg} ${config.border} border`} />
                <span className="text-xs text-gray-500">{config.label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[#fafafa] overflow-auto relative p-8 flex items-center justify-center"
      >
        {/* The Map Canvas with a fixed size (850x700) */}
        <div 
          ref={canvasRef}
          className="relative bg-white shadow-md border-2 border-dashed border-gray-300 select-none"
          style={{ 
            width: "850px", 
            height: "700px",
            cursor: isDragging ? "grabbing" : "default" 
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid pattern background for visual guidance */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
              backgroundSize: '10px 10px'
            }}
          />

          {tables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-gray-400 font-medium text-lg">Chưa có bàn nào</p>
                <p className="text-gray-400 text-sm mt-1">Nhấn "Thêm bàn" để bắt đầu</p>
              </div>
            </div>
          ) : (
            tables.map((table) => {
              const statusConfig = TABLE_STATUS_CONFIG[table.status];
              const isCircle = table.shape === 'CIRCLE';
              
              // Map shape to CSS
              const shapeClasses = isCircle ? 'rounded-full' : 'rounded-lg';
              
              return (
                <div
                  key={table._id}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  className={`absolute flex flex-col items-center justify-center border-2 transition-shadow cursor-grab active:cursor-grabbing group
                    ${statusConfig.bg} ${statusConfig.border} ${shapeClasses}
                    ${draggedTableId === table._id ? 'shadow-xl z-50 ring-2 ring-blue-400 opacity-90' : 'shadow-sm z-10 hover:shadow-md'}
                  `}
                  style={{
                    left: table.x || 0,
                    top: table.y || 0,
                    width: table.width || 70,
                    height: (isCircle ? table.width : table.height) || 70, // Circles use width for both
                  }}
                  title={`Bàn ${table.table_number} - ${table.capacity} chỗ`}
                >
                  {/* Edit overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTable(table);
                    }}
                    className="edit-btn absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors hidden group-hover:flex z-50 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <span className={`font-bold ${statusConfig.color} ${isCircle && table.width && table.width < 50 ? 'text-sm' : 'text-lg'}`}>
                    {table.table_number}
                  </span>
                  
                  {(!isCircle || (table.width && table.width >= 50)) && (
                    <span className={`text-xs ${statusConfig.color} opacity-80 mt-1`}>
                      {table.capacity} chỗ
                    </span>
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
