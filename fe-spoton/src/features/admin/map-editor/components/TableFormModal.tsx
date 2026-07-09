"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, Image as ImageIcon, RefreshCcw, AlertTriangle, ScanLine, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadTableImageApi } from "../map-editor.service";
import Image from "next/image";
import { QRCodeSVG } from 'qrcode.react';
import type { TableStatus } from "../map-editor.types";
import { TABLE_STATUS_CONFIG } from "../map-editor.types";
import { ADMIN_TEXTS } from "@/constants/texts/admin";

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE"; x?: number; y?: number; image_url?: string | null }) => Promise<void>;
  onDelete?: () => void;
  initialData?: { table_number: string; capacity: number; status: TableStatus; width?: number; height?: number; shape?: "RECTANGLE" | "CIRCLE"; x?: number; y?: number; image_url?: string | null } | null;
  mode: "create" | "edit";
  zoneName: string;
  isTemplate?: boolean;
  hasActiveBookings?: boolean;
  tableId?: string;
}

const ALL_STATUSES: TableStatus[] = ["EMPTY", "HOLDING", "LOCKED", "RESERVED", "OCCUPIED", "CLEANING"];

export function TableFormModal({ isOpen, onClose, onSubmit, onDelete, initialData, mode, zoneName, isTemplate = false, hasActiveBookings = false, tableId }: TableFormModalProps) {
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
      alert(ADMIN_TEXTS.mapEditor.modalTableErrorInvalidImage);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(ADMIN_TEXTS.mapEditor.modalTableErrorImageSize);
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadTableImageApi(file);
      if (res.success) {
        setImageUrl(res.data.url);
      } else {
        alert(res.message || ADMIN_TEXTS.mapEditor.modalTableErrorUploadFail);
      }
    } catch (error) {
      console.error(error);
      alert(ADMIN_TEXTS.mapEditor.modalTableErrorUploadError);
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
              {mode === "create" ? ADMIN_TEXTS.mapEditor.modalTableTitleCreate : ADMIN_TEXTS.mapEditor.modalTableTitleEdit}
            </h2>
            <button type="button" aria-label="Đóng" onClick={onClose} className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {ADMIN_TEXTS.mapEditor.modalTableZoneLabel} <span className="font-semibold">{zoneName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {ADMIN_TEXTS.mapEditor.modalTableNumber} <span className="text-red-500">*</span>
              </label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={ADMIN_TEXTS.mapEditor.modalTableNumberPlaceholder}
                required
                autoFocus
                className="h-8 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {ADMIN_TEXTS.mapEditor.modalTableCapacity} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min={1}
                max={20}
                required
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {ADMIN_TEXTS.mapEditor.modalTableWidth}
              </label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={30}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {ADMIN_TEXTS.mapEditor.modalTableHeight}
              </label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={30}
                disabled={shape === "CIRCLE"}
                title={shape === "CIRCLE" ? ADMIN_TEXTS.mapEditor.modalTableHeightHint : ""}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {ADMIN_TEXTS.mapEditor.modalTableImage}
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 rounded-xl p-3 flex flex-col items-center justify-center bg-gray-50/50 text-center relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {imageUrl ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[140px] h-[80px] rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-2 group bg-white flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt="Table image"
                      width={140}
                      height={80}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                        title={ADMIN_TEXTS.mapEditor.modalTableBtnDeleteImg}
                        aria-label={ADMIN_TEXTS.mapEditor.modalTableBtnDeleteImg}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? ADMIN_TEXTS.mapEditor.modalTableBtnUploading : ADMIN_TEXTS.mapEditor.modalTableBtnChangeImg}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1.5">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2 max-w-[200px] leading-tight">
                    {ADMIN_TEXTS.mapEditor.modalTableImgHint}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-white shadow-sm hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none h-7 text-[11px] px-3"
                  >
                    {isUploading ? <RefreshCcw className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    {isUploading ? ADMIN_TEXTS.mapEditor.modalTableBtnUploading : ADMIN_TEXTS.mapEditor.modalTableBtnUploadImg}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {mode === "edit" && !isTemplate && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {ADMIN_TEXTS.mapEditor.modalTableStatusLabel}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
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

          {/* QR Code Section for iPad Self-Ordering */}
          {mode === 'edit' && tableId && (
            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-700 font-bold mb-3 text-sm">
                <ScanLine className="w-4 h-4 text-blue-600" />
                Mã QR Self-Ordering (In đặt tại bàn)
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl shadow-sm border border-slate-100 mb-3">
                <QRCodeSVG 
                  value={`${window.location.origin}/ipad/table/${tableId}`} 
                  size={110}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 text-center px-4">
                Sử dụng mã QR này in ra dán tại bàn để khách hàng quét gọi món.
              </p>
            </div>
          )}

          {hasActiveBookings && mode === "edit" && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-red-700 flex items-start gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-800">Cảnh báo hệ thống</p>
                <p className="text-xs mt-0.5">Không thể xóa bàn này vì đang có đơn đặt trong Ca Trưa hoặc Ca Tối.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="outline"
                className={`text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 ${(status !== 'EMPTY' || hasActiveBookings) ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={onDelete}
                disabled={isSubmitting || status !== 'EMPTY' || hasActiveBookings}
                title={hasActiveBookings ? "Bàn đang có đơn đặt" : status !== 'EMPTY' ? "Không thể xóa bàn đang có khách hoặc đã đặt" : "Xóa bàn"}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {ADMIN_TEXTS.mapEditor.modalTableBtnDelete}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {ADMIN_TEXTS.mapEditor.modalTableBtnCancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 border-0"
              disabled={isSubmitting || isUploading || !tableNumber.trim() || capacity < 1}
            >
              {isSubmitting && <RefreshCcw className="w-4 h-4 mr-1.5 animate-spin" />}
              {isSubmitting ? ADMIN_TEXTS.mapEditor.modalTableBtnSaving : mode === "create" ? ADMIN_TEXTS.mapEditor.modalTableBtnCreate : ADMIN_TEXTS.mapEditor.modalTableBtnSave}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
