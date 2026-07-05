"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

import { ZoneSidebar } from "../map-editor/components/ZoneSidebar";
import { TableTemplatesSidebar } from "../map-editor/components/TableTemplatesSidebar";
import { TableCanvas } from "../map-editor/components/TableCanvas";
import { ZoneFormModal } from "../map-editor/components/ZoneFormModal";
import { TableFormModal } from "../map-editor/components/TableFormModal";
import { DeleteConfirmModal } from "../map-editor/components/DeleteConfirmModal";

import {
  fetchZones,
  createZone,
  updateZoneApi,
  deleteZoneApi,
  createTable,
  updateTableApi,
  deleteTableApi,
  bulkUpdateTablesLayout,
} from "./template-editor.service";

import type { EditorZone, EditorTable, TableStatus } from "../map-editor/map-editor.types";

interface TemplateEditorFeatureProps {
  templateId: string;
}

export function TemplateEditorFeature({ templateId }: TemplateEditorFeatureProps) {
  const { success, error: showError } = useToast();

  // Data state
  const [templateName, setTemplateName] = useState("");
  const [zones, setZones] = useState<EditorZone[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  // Modal state
  const [zoneModal, setZoneModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: { name: string; capacity: number } | null;
    zoneId?: string;
  }>({ open: false, mode: "create" });

  const [tableModal, setTableModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: { table_number: string; capacity: number; status: TableStatus; width?: number; height?: number; shape?: "RECTANGLE"|"CIRCLE"; x?: number; y?: number; image_url?: string | null } | null;
    tableId?: string;
  }>({ open: false, mode: "create" });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "zone" | "table";
    id: string;
    name: string;
    parentId?: string; // zoneId for table deletion
  }>({ open: false, type: "zone", id: "", name: "" });

  // Selected zone object
  const selectedZone = zones.find((z) => z._id === selectedZoneId) || null;

  // =============================================
  // FETCH DATA
  // =============================================
  const loadZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchZones(templateId);
      if (res.success) {
        setTemplateName(res.data.branch_name);
        setZones(res.data.zones);
        setTemplates(res.data.table_templates || []);
        // Auto-select first zone if none selected
        setSelectedZoneId((prev) => {
          if (!prev && res.data.zones.length > 0) {
            return res.data.zones[0]._id;
          }
          return prev;
        });
      }
    } catch (err) {
      showError("Không thể tải dữ liệu sơ đồ mẫu.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // =============================================
  // ZONE CRUD HANDLERS
  // =============================================
  const handleCreateZone = async () => {};
  const handleUpdateZone = async () => {};
  const handleDeleteZone = async () => {};

  // =============================================
  // TABLE CRUD HANDLERS
  // =============================================
  const handleCreateTable = async (data: { table_number: string; capacity: number }) => {
    if (!selectedZoneId) return;
    const res = await createTable(templateId, selectedZoneId, data);
    if (res.success) {
      success(`Thêm bàn "${data.table_number}" thành công!`);
      await loadZones();
    }
  };

  const handleUpdateTable = async (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: string }) => {
    if (!selectedZoneId || !tableModal.tableId) return;
    const res = await updateTableApi(templateId, selectedZoneId, tableModal.tableId, data as any);
    if (res.success) {
      success("Cập nhật bàn thành công!");
      await loadZones();
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteModal.parentId) return;
    const res = await deleteTableApi(templateId, deleteModal.parentId, deleteModal.id);
    if (res.success) {
      success(`Xóa bàn "${deleteModal.name}" thành công!`);
      await loadZones();
    }
  };

  const handleSaveLayout = async (tablesLayout: { _id: string; x: number; y: number; width?: number; height?: number }[]) => {
    if (!selectedZoneId) return;
    const res = await bulkUpdateTablesLayout(templateId, selectedZoneId, tablesLayout);
    if (res.success) {
      success("Lưu sơ đồ bàn thành công!");
      await loadZones();
    }
  };

  const handleDropTemplate = (templateData: any, x: number, y: number) => {
    setTableModal({
      open: true,
      mode: "create",
      data: {
        table_number: "",
        capacity: templateData.capacity,
        status: "EMPTY",
        width: templateData.width,
        height: templateData.height,
        shape: templateData.shape,
        image_url: templateData.image_url,
        x,
        y,
      },
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center text-sm mb-2">
        <Link
          href="/admin/map-templates"
          className="text-gray-500 hover:text-indigo-700 transition-colors"
        >
          Map Templates
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Template Editor</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/map-templates">
            <Button variant="outline" size="sm" className="bg-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sơ Đồ Mẫu
            </h1>
            <p className="text-sm text-gray-500">
              {templateName || "Đang tải..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm hover:bg-gray-50"
            onClick={() => loadZones()}
            disabled={isLoading}
          >
            <RefreshCcw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Templates Sidebar */}
        <TableTemplatesSidebar 
          branchId="" // Disable edits
          templates={templates} 
          onTemplateUpdate={loadZones}
        />

        {/* Table Canvas (Drag & Drop) */}
        <TableCanvas
          zone={selectedZone}
          onAddTable={() => setTableModal({ open: true, mode: "create" })}
          onSaveLayout={handleSaveLayout}
          onDropTemplate={handleDropTemplate}
          onEditTable={(table) =>
            setTableModal({
              open: true,
              mode: "edit",
              data: {
                table_number: table.table_number,
                capacity: table.capacity,
                status: table.status,
                width: table.width,
                height: table.height,
                shape: table.shape as "RECTANGLE" | "CIRCLE",
                image_url: table.image_url,
              },
              tableId: table._id,
            })
          }
        />
      </div>

      {/* =============================================
          MODALS
          ============================================= */}

      {/* Zone Form Modal */}
      <ZoneFormModal
        isOpen={zoneModal.open}
        onClose={() => setZoneModal({ open: false, mode: "create" })}
        onSubmit={zoneModal.mode === "create" ? handleCreateZone : handleUpdateZone}
        initialData={zoneModal.data}
        mode={zoneModal.mode}
      />

      {/* Table Form Modal */}
      <TableFormModal
        isOpen={tableModal.open}
        onClose={() => setTableModal({ open: false, mode: "create" })}
        onSubmit={tableModal.mode === "create" ? handleCreateTable : handleUpdateTable}
        onDelete={
          tableModal.mode === "edit" && tableModal.tableId && selectedZoneId
            ? () => {
                const table = selectedZone?.tables.find((t) => t._id === tableModal.tableId);
                setTableModal({ open: false, mode: "create" });
                setDeleteModal({
                  open: true,
                  type: "table",
                  id: tableModal.tableId!,
                  name: table?.table_number || "",
                  parentId: selectedZoneId!,
                });
              }
            : undefined
        }
        initialData={tableModal.data}
        mode={tableModal.mode}
        zoneName={selectedZone?.name || ""}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: "zone", id: "", name: "" })}
        onConfirm={deleteModal.type === "zone" ? handleDeleteZone : handleDeleteTable}
        title={deleteModal.type === "zone" ? "Xóa khu vực?" : "Xóa bàn?"}
        description={
          deleteModal.type === "zone"
            ? "Tất cả bàn trong khu vực này cũng sẽ bị xóa. Hành động này không thể hoàn tác."
            : "Bàn sẽ bị xóa khỏi khu vực. Hành động này không thể hoàn tác."
        }
        itemName={deleteModal.name}
      />
    </div>
  );
}
