"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadTableImageApi } from "../map-editor.service";
import Image from "next/image";
import type { TableStatus } from "../map-editor.types";
import { TABLE_STATUS_CONFIG } from "../map-editor.types";

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE"; x?: number; y?: number; image_url?: string | null }) => Promise<void>;
  onDelete?: () => void;
  initialData?: { table_number: string; capacity: number; status: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE"; x?: number; y?: number; image_url?: string | null } | null;
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
  const [x, setX] = useState<number | undefined>(undefined);
  const [y, setY] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTableNumber(initialData?.table_number || "");
      setCapacity(initialData?.capacity || 2);
      setStatus(initialData?.status || "EMPTY");
      setShape(initialData?.shape || "RECTANGLE");
      setWidth(initialData?.width || 70);
      setHeight(initialData?.height || 70);
      setX(initialData?.x);
      setY(initialData?.y);
      setImageUrl(initialData?.image_url || null);
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
        shape,
        x,
        y,
        image_url: imageUrl
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (5MB)
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadTableImageApi(file);
      if (res.success) {
        setImageUrl(res.data.url);
      } else {
        alert(res.message || "Lỗi khi tải ảnh lên.");
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi tải ảnh lên.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-300 slide-in-from-bottom-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {mode === "create" ? "Thêm Bàn Mới" : "Chỉnh Sửa Bàn"}
            </h2>
            <button type="button" aria-label="Đóng" onClick={onClose} className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Hình ảnh bàn (Tùy chọn)
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 rounded-xl p-5 flex flex-col items-center justify-center bg-gray-50/50 text-center relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {imageUrl ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[200px] h-[120px] rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-3 group bg-white flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt="Table image"
                      width={200}
                      height={120}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="p-2 bg-red-600/90 text-white rounded-full hover:bg-red-700 hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                        title="Xóa ảnh"
                        aria-label="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Đang tải..." : "Đổi ảnh khác"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-500 mb-3 max-w-[250px]">
                    Tải lên hình ảnh thực tế của bàn, ghế sofa, hoặc cây cảnh để hiển thị trên sơ đồ. (Tối đa 5MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-white shadow-sm hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  >
                    {isUploading ? <RefreshCcw className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                    {isUploading ? "Đang tải..." : "Chọn ảnh"}
                  </Button>
                </div>
              )}
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
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        status === s
                          ? `${config.bg} ${config.border} ${config.color} ring-2 ring-offset-1 ring-current shadow-sm scale-[1.02]`
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm"
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
                <Trash2 className="w-4 h-4 mr-1.5" />
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
              disabled={isSubmitting || isUploading || !tableNumber.trim() || capacity < 1}
            >
              {isSubmitting && <RefreshCcw className="w-4 h-4 mr-1.5 animate-spin" />}
              {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm Bàn" : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
