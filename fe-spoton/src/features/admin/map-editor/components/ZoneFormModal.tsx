"use client";

import React, { useState, useEffect } from "react";
import { X, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; capacity: number }) => Promise<void>;
  initialData?: { name: string; capacity: number } | null;
  mode: "create" | "edit";
}

export function ZoneFormModal({ isOpen, onClose, onSubmit, initialData, mode }: ZoneFormModalProps) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setCapacity(initialData?.capacity || 0);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), capacity });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-300 slide-in-from-bottom-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {mode === "create" ? "Thêm Khu Vực Mới" : "Chỉnh Sửa Khu Vực"}
            </h2>
            <button type="button" aria-label="Đóng" onClick={onClose} className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            {mode === "create" ? "Tạo một khu vực mới trong chi nhánh" : "Cập nhật thông tin khu vực"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên khu vực <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='VD: "Tầng 1", "Sân vườn", "VIP"'
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Sức chứa tối đa (người)
            </label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={0}
              placeholder="VD: 50"
            />
            <p className="text-xs text-gray-400 mt-1">Để 0 nếu không giới hạn</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-amber-700 hover:bg-amber-800 border-0"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting && <RefreshCcw className="w-4 h-4 mr-1.5 animate-spin" />}
              {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm Khu Vực" : "Lưu Thay Đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
