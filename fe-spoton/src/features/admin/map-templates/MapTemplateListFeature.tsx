"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchMapTemplates, createMapTemplate, deleteMapTemplate } from "./map-template.service";
import { Button } from "@/components/ui/Button";
import { Plus, Edit2, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

export function MapTemplateListFeature() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: showError } = useToast();

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetchMapTemplates();
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
      showError("Không thể tải danh sách mẫu sơ đồ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    const name = window.prompt("Nhập tên sơ đồ mẫu:");
    if (!name) return;
    try {
      const res = await createMapTemplate({ name, description: "Mô tả mẫu" });
      if (res.success) {
        success("Tạo mẫu thành công");
        loadTemplates();
      }
    } catch (err) {
      showError("Lỗi khi tạo mẫu");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu "${name}" không?`)) return;
    try {
      const res = await deleteMapTemplate(id);
      if (res.success) {
        success("Xóa mẫu thành công");
        loadTemplates();
      }
    } catch (err) {
      showError("Lỗi khi xóa mẫu");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Sơ đồ mẫu</h1>
          <p className="text-gray-500 text-sm">Tạo và chỉnh sửa các sơ đồ để các chi nhánh sử dụng.</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo Sơ đồ Mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Chưa có sơ đồ mẫu nào được tạo.</p>
          <Button onClick={handleCreate} variant="outline">Tạo Mẫu Đầu Tiên</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border-b border-gray-100">
                <LayoutGrid className="w-12 h-12 text-indigo-200" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{tpl.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tpl.description || "Không có mô tả"}</p>
                <div className="text-xs text-gray-400 mb-4">
                  Tạo ngày: {tpl.created_at ? format(new Date(tpl.created_at), "dd/MM/yyyy HH:mm") : ""}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/map-templates/${tpl._id}/editor`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" /> Edit Design
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(tpl._id, tpl.name)} className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
