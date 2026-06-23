"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TableStatus } from "../map-editor.types";
import { TABLE_STATUS_CONFIG } from "../map-editor.types";

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE" }) => Promise<void>;
  onDelete?: () => void;
  initialData?: { table_number: string; capacity: number; status: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE" } | null;
  mode: "create" | "edit";
  zoneName: string;
}

const ALL_STATUSES: TableStatus[] = ["EMPTY", "HOLDING", "LOCKED", "RESERVED", "OCCUPIED", "CLEANING"];

export function TableFormModal({ isOpen, onClose, onSubmit, onDelete, initialData, mode, zoneName }: TableFormModalProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [status, setStatus] = useState<TableStatus>("EMPTY");
  const [shape, setShape] = useState<"RECTANGLE" | "CIRCLE">("RECTANGLE");
  const [width, setWidth] = useState(70);
  const [height, setHeight] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTableNumber(initialData?.table_number || "");
      setCapacity(initialData?.capacity || 2);
      setStatus(initialData?.status || "EMPTY");
      setShape(initialData?.shape || "RECTANGLE");
      setWidth(initialData?.width || 70);
      setHeight(initialData?.height || 70);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim() || capacity < 1) return;
    setIsSubmitting(true);
    try {
      const data: any = {
        table_number: tableNumber.trim(),
        capacity,
        width,
        height,
        shape
      };
      if (mode === "edit") data.status = status;
      await onSubmit(data);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {mode === "create" ? "Thêm Bàn Mới" : "Chỉnh Sửa Bàn"}
            </h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Khu vực: <span className="font-semibold">{zoneName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Số bàn <span className="text-red-500">*</span>
            </label>
            <Input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder='VD: "A1", "B2", "VIP-01"'
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Sức chứa <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min={1}
                max={20}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Hình dáng
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShape("RECTANGLE")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                    shape === "RECTANGLE" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Vuông/Chữ nhật
                </button>
                <button
                  type="button"
                  onClick={() => setShape("CIRCLE")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                    shape === "CIRCLE" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Tròn
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Chiều rộng (px)
              </label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={30}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Chiều dài (px)
              </label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={30}
                disabled={shape === "CIRCLE"}
                title={shape === "CIRCLE" ? "Bàn tròn sẽ dùng chung một đường kính" : ""}
              />
            </div>
          </div>

          {mode === "edit" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trạng thái
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_STATUSES.map((s) => {
                  const config = TABLE_STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                        status === s
                          ? `${config.bg} ${config.border} ${config.color} ring-2 ring-offset-1 ring-current`
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Xóa bàn
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 border-0"
              disabled={isSubmitting || !tableNumber.trim() || capacity < 1}
            >
              {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm Bàn" : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
