"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchMapTemplates, createMapTemplate, deleteMapTemplate } from "./map-template.service";
import { Button } from "@/components/ui/Button";
import { Plus, Edit2, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

import { useRouter } from "next/navigation";

export function MapTemplateListFeature() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const handleOpenCreateModal = () => {
    setNewTemplateName(`Sơ đồ mới ${templates.length + 1}`);
    setNewTemplateDesc("Mô tả mẫu");
    setIsCreateModalOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      const res = await createMapTemplate({ 
        name: newTemplateName.trim(), 
        description: newTemplateDesc.trim() || "Mô tả mẫu" 
      });
      if (res.success && res.data?._id) {
        success("Tạo mẫu thành công");
        setIsCreateModalOpen(false);
        router.push(`/admin/map-templates/${res.data._id}/editor`);
      } else {
        showError("Không thể tạo sơ đồ mới.");
      }
    } catch (err) {
      showError("Lỗi khi tạo mẫu");
    }
  };

  const handleOpenDeleteModal = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleSubmitDelete = async () => {
    if (!templateToDelete) return;
    try {
      const res = await deleteMapTemplate(templateToDelete.id);
      if (res.success) {
        success("Xóa mẫu thành công");
        setIsDeleteModalOpen(false);
        setTemplateToDelete(null);
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
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
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
          <Button onClick={handleOpenCreateModal} variant="outline">Tạo Mẫu Đầu Tiên</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên sơ đồ</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((tpl) => (
                  <tr key={tpl._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-900">{tpl.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{tpl.description || "Không có mô tả"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tpl.created_at ? format(new Date(tpl.created_at), "dd/MM/yyyy HH:mm") : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/map-templates/${tpl._id}/editor`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" /> Sửa thiết kế
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDeleteModal(tpl._id, tpl.name)} className="text-red-600 border-red-200 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-950 mb-4">Tạo Sơ đồ Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sơ đồ mẫu</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-gray-900"
                  placeholder="Ví dụ: Tầng 1, Khu vực VIP..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (không bắt buộc)</label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm h-20 resize-none text-gray-900"
                  placeholder="Nhập mô tả cho sơ đồ mẫu này..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewTemplateName("");
                  setNewTemplateDesc("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitCreate}
                disabled={!newTemplateName.trim()}
              >
                Tạo sơ đồ
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-950 mb-2">Xóa Sơ đồ Mẫu</h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa sơ đồ mẫu <span className="font-semibold text-gray-850">"{templateToDelete.name}"</span> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTemplateToDelete(null);
                }}
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
                onClick={handleSubmitDelete}
              >
                Xóa sơ đồ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
