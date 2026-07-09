"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Save, Undo2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EditorTable, EditorZone } from "../map-editor.types";
import { TABLE_STATUS_CONFIG } from "../map-editor.types";
import { ADMIN_TEXTS } from "@/constants/texts/admin";

interface TableCanvasProps {
  zone: EditorZone | null;
  bookings?: any[];
  onAddTable: () => void;
  onEditTable: (table: EditorTable) => void;
  onSaveLayout: (
    tables: {
      _id: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }[],
  ) => Promise<void>;
  onDropTemplate?: (templateData: any, x: number, y: number) => void;
}

export function TableCanvas({
  zone,
  bookings,
  onAddTable,
  onEditTable,
  onSaveLayout,
  onDropTemplate,
}: TableCanvasProps) {
  const [tables, setTables] = useState<EditorTable[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingTableId, setResizingTableId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

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
      setIsPanning(false);
      setDraggedTableId(null);
      setResizingTableId(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  if (!zone) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-12">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">{ADMIN_TEXTS.mapEditor.canvasSelectAreaTitle}</h3>
        <p className="text-gray-500 text-center max-w-sm">
          {ADMIN_TEXTS.mapEditor.canvasSelectAreaHint}
        </p>
      </div>
    );
  }

  // --- Drag and Drop Logic ---
  const handleMouseDown = (e: React.MouseEvent, table: EditorTable) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    // If clicking on edit button, don't drag
    if ((e.target as HTMLElement).closest(".edit-btn")) {
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
        y: mouseY - (table.y || 0),
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    // Only pan if clicking directly on canvas or grid lines
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('pointer-events-none')) {
      return;
    }

    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current?.scrollLeft || 0,
      scrollTop: containerRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft = panStart.scrollLeft - dx;
      containerRef.current.scrollTop = panStart.scrollTop - dy;
      return;
    }

    if (isDragging && draggedTableId) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        let newX = e.clientX - canvasRect.left - dragOffset.x;
        let newY = e.clientY - canvasRect.top - dragOffset.y;

        // Snap to 10px grid
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;

        const targetTable = tables.find((t) => t._id === draggedTableId);
        const tWidth = targetTable?.width || 70;
        const tHeight = targetTable?.height || 70;

        // Boundary check (assume canvas is 2000x2000)
        newX = Math.max(0, Math.min(newX, 2000 - tWidth));
        newY = Math.max(0, Math.min(newY, 2000 - tHeight));

        setTables((prev) =>
          prev.map((t) =>
            t._id === draggedTableId ? { ...t, x: newX, y: newY } : t,
          ),
        );
        setHasChanges(true);
      }
    } else if (resizingTableId) {
      const targetTable = tables.find((t) => t._id === resizingTableId);
      if (!targetTable) return;

      let newWidth = resizeStart.startWidth + (e.clientX - resizeStart.startX);
      let newHeight =
        resizeStart.startHeight + (e.clientY - resizeStart.startY);

      // Snap to grid
      newWidth = Math.round(newWidth / 10) * 10;
      newHeight = Math.round(newHeight / 10) * 10;

      // Min limits
      newWidth = Math.max(30, newWidth);
      newHeight = Math.max(30, newHeight);

      if (targetTable.shape === "CIRCLE") {
        const size = Math.max(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
      }

      setTables((prev) =>
        prev.map((t) =>
          t._id === resizingTableId
            ? { ...t, width: newWidth, height: newHeight }
            : t,
        ),
      );
      setHasChanges(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    setDraggedTableId(null);
    setResizingTableId(null);
  };

  const handleMouseDownResize = (e: React.MouseEvent, table: EditorTable) => {
    e.stopPropagation();
    setResizingTableId(table._id);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: table.width || 70,
      startHeight: table.height || 70,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const layoutData = tables.map((t) => ({
        _id: t._id,
        x: t.x || 0,
        y: t.y || 0,
        width: t.width || 70,
        height: t.height || 70,
      }));
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

  // --- HTML5 Drag & Drop cho Templates ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Cần thiết để cho phép drop
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDropTemplate) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const templateData = JSON.parse(dataStr);

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        let x = e.clientX - canvasRect.left;
        let y = e.clientY - canvasRect.top;

        // Căn giữa template vào vị trí con trỏ chuột
        x = x - (templateData.width || 70) / 2;
        y = y - (templateData.height || 70) / 2;

        // Snap to grid
        x = Math.round(x / 10) * 10;
        y = Math.round(y / 10) * 10;

        // Boundary check
        x = Math.max(0, Math.min(x, 2000 - (templateData.width || 70)));
        y = Math.max(0, Math.min(y, 2000 - (templateData.height || 70)));

        onDropTemplate(templateData, x, y);
      }
    } catch (error) {
      console.error(ADMIN_TEXTS.mapEditor.canvasDropTemplateError, error);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{zone.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {tables.length} {ADMIN_TEXTS.mapEditor.canvasUnitTable}
              {zone.capacity > 0 && ` · ${ADMIN_TEXTS.mapEditor.canvasUnitCapacity}${zone.capacity}${ADMIN_TEXTS.mapEditor.canvasUnitPerson}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={isSaving}
                >
                  <Undo2 className="w-4 h-4 mr-1.5" />
                  {ADMIN_TEXTS.mapEditor.canvasBtnUndo}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 border-0"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSaving ? ADMIN_TEXTS.mapEditor.canvasBtnSaving : ADMIN_TEXTS.mapEditor.canvasBtnSave}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {(
            Object.entries(TABLE_STATUS_CONFIG) as [
              string,
              { label: string; color: string; bg: string; border: string },
            ][]
          ).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-sm ${config.bg} ${config.border} border`}
              />
              <span className="text-xs text-gray-500">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 flex flex-col h-[calc(100vh-140px)]">
        <div 
          ref={containerRef}
          className="relative w-full h-full overflow-auto rounded-2xl border border-gray-200/60 shadow-inner bg-gray-50"
        >
          <div
            ref={canvasRef}
            className="relative bg-[#f8fafc] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] select-none"
            style={{
              width: "2000px",
              height: "2000px",
              backgroundSize: "16px 16px",
              cursor: isPanning ? "grabbing" : (isDragging ? "grabbing" : "grab"),
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />

            {tables.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-gray-400 font-medium text-lg">
                    {ADMIN_TEXTS.mapEditor.canvasEmptyTitle}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {ADMIN_TEXTS.mapEditor.canvasEmptyHint}
                  </p>
                </div>
              </div>
            ) : (
              tables.map((table) => {
                const statusConfig = TABLE_STATUS_CONFIG[table.status];
                const isCircle = table.shape === "CIRCLE";

                // Tính toán ca đã được đặt cho bàn này
                const tableBookings = bookings?.filter((b) => b.table_ids.includes(table._id)) || [];
                const lunchBooking = tableBookings.find(b => b.shift === 'LUNCH');
                const dinnerBooking = tableBookings.find(b => b.shift === 'DINNER');

                const getShiftConfig = (booking: any) => {
                  if (!booking) return TABLE_STATUS_CONFIG['EMPTY'];
                  if (booking.status === 'CONFIRMED') return TABLE_STATUS_CONFIG['RESERVED'];
                  if (booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING_DEPOSIT') return TABLE_STATUS_CONFIG['LOCKED'];
                  if (booking.status === 'HOLDING') return TABLE_STATUS_CONFIG['HOLDING'];
                  return TABLE_STATUS_CONFIG['EMPTY'];
                };

                const lunchConfig = getShiftConfig(lunchBooking);
                const dinnerConfig = getShiftConfig(dinnerBooking);

                // Map shape to CSS
                const shapeClasses = isCircle ? "rounded-full" : "rounded-lg";

                return (
                  <div
                    key={table._id}
                    onMouseDown={(e) => handleMouseDown(e, table)}
                    className={`absolute flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing group
                    ${table.image_url ? "bg-transparent border-transparent" : `border-2 ${statusConfig.bg} ${statusConfig.border}`}
                    ${shapeClasses}
                    ${draggedTableId === table._id ? "shadow-2xl z-50 ring-4 ring-blue-400/50 scale-105 opacity-95" : "shadow-sm z-10 hover:shadow-md"}
                  `}
                    style={{
                      left: table.x || 0,
                      top: table.y || 0,
                      width: table.width || 70,
                      height: (isCircle ? table.width : table.height) || 70, // Circles use width for both
                    }}
                    title={`${ADMIN_TEXTS.mapEditor.canvasTableTitlePrefix}${table.table_number} - ${table.capacity}${ADMIN_TEXTS.mapEditor.canvasSeatSuffix}`}
                  >
                    {/* Edit overlay */}
                    <button
                      type="button"
                      aria-label={`${ADMIN_TEXTS.mapEditor.canvasEditTable}${table.table_number}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTable(table);
                      }}
                      className="edit-btn absolute -top-3 -right-3 w-8 h-8 bg-white/90 backdrop-blur border border-gray-200/80 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-amber-50 hover:scale-110 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100 z-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {table.image_url ? (
                      <>
                        <img
                          src={table.image_url}
                          alt={`${ADMIN_TEXTS.mapEditor.canvasTableTitlePrefix}${table.table_number}`}
                          className={`w-full h-full object-contain pointer-events-none p-1 ${shapeClasses}`}
                          draggable={false}
                        />
                        <div
                          className={`absolute top-0 left-0 ${statusConfig.bg} ${statusConfig.border} border-b border-r text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md rounded-br-md shadow-sm pointer-events-none`}
                        >
                          {table.table_number}
                        </div>
                      </>
                    ) : (
                      <>
                        <span
                          className={`font-bold ${statusConfig.color} ${isCircle && table.width && table.width < 50 ? "text-sm" : "text-lg"}`}
                        >
                          {table.table_number}
                        </span>

                        {(!isCircle || (table.width && table.width >= 50)) && (
                          <span
                            className={`text-xs ${statusConfig.color} opacity-80 mt-1 pointer-events-none`}
                          >
                            {table.capacity}{ADMIN_TEXTS.mapEditor.canvasSeatSuffix}
                          </span>
                        )}
                      </>
                    )}

                    {/* Resize handle */}
                    <div
                      tabIndex={0}
                      role="button"
                      aria-label={`${ADMIN_TEXTS.mapEditor.canvasResizeTable}${table.table_number}`}
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-nwse-resize opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-50 flex items-center justify-center rounded-full hover:scale-110 hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      onMouseDown={(e) => handleMouseDownResize(e, table)}
                      title={`${ADMIN_TEXTS.mapEditor.canvasResizeTable}${table.table_number}`}
                    >
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    </div>

                    {/* Status Label underneath the table */}
                    <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none z-10 w-max">
                      {table.status !== 'EMPTY' && table.status !== 'OCCUPIED' && (
                        <div className={`mb-0.5 whitespace-nowrap text-[9px] px-2 py-0.5 rounded-full border shadow-sm ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} font-bold uppercase tracking-wider`}>
                          Trạng thái gốc: {statusConfig.label}
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <div className={`flex flex-col items-center justify-center px-1.5 py-0.5 rounded border shadow-sm ${lunchConfig.bg} ${lunchConfig.border}`}>
                          <span className="text-[7px] text-gray-500 font-semibold uppercase leading-none mb-0.5">Ca Trưa</span>
                          <span className={`text-[8px] font-bold uppercase leading-none ${lunchConfig.color}`}>{lunchConfig.label}</span>
                        </div>
                        <div className={`flex flex-col items-center justify-center px-1.5 py-0.5 rounded border shadow-sm ${dinnerConfig.bg} ${dinnerConfig.border}`}>
                          <span className="text-[7px] text-gray-500 font-semibold uppercase leading-none mb-0.5">Ca Tối</span>
                          <span className={`text-[8px] font-bold uppercase leading-none ${dinnerConfig.color}`}>{dinnerConfig.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
