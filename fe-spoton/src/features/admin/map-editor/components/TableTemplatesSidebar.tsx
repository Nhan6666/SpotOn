"use client";

import React, { useState, useRef } from "react";
import { Users, Upload, RefreshCcw } from "lucide-react";
import Image from "next/image";
import { uploadTableImageApi, updateTableTemplateApi } from "../map-editor.service";
import type { TableTemplate } from "../map-editor.types";
import { Button } from "@/components/ui/Button";


const DEFAULT_TEMPLATES: TableTemplate[] = [
  {
    label: "Bàn 2 người",
    capacity: 2,
    width: 70,
    height: 70,
    shape: "RECTANGLE",
  },
  {
    label: "Bàn 4 người",
    capacity: 4,
    width: 120,
    height: 80,
    shape: "RECTANGLE",
  },
  {
    label: "Bàn 8 người (CN)",
    capacity: 8,
    width: 200,
    height: 100,
    shape: "RECTANGLE",
  },
  {
    label: "Bàn 8 người (Tròn)",
    capacity: 8,
    width: 160,
    height: 160,
    shape: "CIRCLE",
  },
];

interface TableTemplatesSidebarProps {
  branchId?: string;
  templates?: TableTemplate[];
  onTemplateUpdate?: () => void;
}

export function TableTemplatesSidebar({ branchId, templates, onTemplateUpdate }: TableTemplatesSidebarProps) {
  const displayTemplates = templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES;
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dùng useRef để tránh lỗi stale state closure do hộp thoại chọn file chặn luồng React render
  const targetIndexRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, template: TableTemplate) => {
    e.dataTransfer.setData("application/json", JSON.stringify(template));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const indexToUpload = targetIndexRef.current;
    
    if (!file || indexToUpload === null || !branchId) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }

    try {
      setUploadingIndex(indexToUpload);
      // Upload to Cloudinary
      const uploadRes = await uploadTableImageApi(file);
      if (uploadRes.success) {
        // Update template in DB
        await updateTableTemplateApi(branchId, indexToUpload, { image_url: uploadRes.data.url });
        if (onTemplateUpdate) onTemplateUpdate();
      } else {
        alert("Upload lỗi: " + uploadRes.message);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cập nhật ảnh mẫu bàn.");
    } finally {
      setUploadingIndex(null);
      targetIndexRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTriggerUpload = (index: number) => {
    targetIndexRef.current = index;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="w-52 h-200 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col shrink-0 self-start sticky top-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelect} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm tracking-widest text-center uppercase shadow-sm">
        CHỌN THEO SỐ LƯỢNG KHÁCH
      </div>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[700px]">
        {displayTemplates.map((tpl, idx) => (
          <div
            key={idx}
            tabIndex={0}
            className="border border-gray-200/60 rounded-xl p-4 bg-white hover:bg-gradient-to-b hover:from-blue-50/50 hover:to-white hover:shadow-[0_4px_20px_rgb(59,130,246,0.15)] hover:border-blue-300 ring-2 ring-transparent focus-visible:ring-indigo-500 focus-visible:outline-none transition-all duration-300 ease-out cursor-grab active:cursor-grabbing flex flex-col items-center text-center group relative hover:-translate-y-0.5 scale-100 hover:scale-[1.02]"
            draggable
            onDragStart={(e) => handleDragStart(e, tpl)}
            title="Kéo và thả vào mặt bằng"
          >
            {/* Overlay nút đổi ảnh */}
            <button
              type="button"
              aria-label={`Đổi ảnh mẫu bàn ${tpl.label}`}
              className="absolute top-2 right-2 p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 z-10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              onClick={(e) => {
                e.stopPropagation(); // Không drag khi click upload
                handleTriggerUpload(idx);
              }}
              title="Đổi ảnh mẫu bàn này"
              disabled={uploadingIndex === idx}
            >
              {uploadingIndex === idx ? (
                <RefreshCcw className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
              <Users className="w-5 h-5" />
              <span>{tpl.capacity} NGƯỜI</span>
            </div>

            {/* Visual representation of the table */}
            {tpl.image_url ? (
              <div 
                className={`mb-3 flex items-center justify-center group-hover:scale-105 transition-transform ${
                  tpl.shape === "CIRCLE" ? "rounded-full" : "rounded-md"
                }`}
                style={{
                  width: `${tpl.width / 3}px`, // Thu nhỏ tỷ lệ 1/3 để vừa sidebar
                  height: `${tpl.height / 3}px`,
                }}
              >
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                  {branchId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 w-6 p-0 bg-white/90 text-blue-600 hover:bg-blue-50 border-blue-200 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerUpload(idx);
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <img 
                  src={tpl.image_url} 
                  alt={tpl.label} 
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div
                className={`relative bg-gradient-to-br from-blue-400 to-blue-600 border border-blue-300 mb-3 shadow-[0_4px_10px_rgb(59,130,246,0.2)] group-hover:scale-105 transition-transform duration-300 ease-out flex items-center justify-center ${
                  tpl.shape === "CIRCLE" ? "rounded-full" : "rounded-lg"
                }`}
                style={{
                  width: `${tpl.width / 3}px`, 
                  height: `${tpl.height / 3}px`,
                }}
              >
                <div className="absolute right-[-10px] top-[-10px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                  {branchId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 w-6 p-0 bg-white/90 text-blue-600 hover:bg-blue-50 border-blue-200 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerUpload(idx);
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="w-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold py-1 px-3 rounded-full inline-block mb-2 shadow-sm">
                {tpl.label}
              </div>
              <p className="text-xs text-gray-500">
                Kích thước: {tpl.shape === "CIRCLE" ? `Ø ${tpl.width} px` : `${tpl.width} x ${tpl.height} px`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
