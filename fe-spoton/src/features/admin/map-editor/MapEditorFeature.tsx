"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

import { ZoneSidebar } from "./components/ZoneSidebar";
import { TableCanvas } from "./components/TableCanvas";
import { ZoneFormModal } from "./components/ZoneFormModal";
import { TableFormModal } from "./components/TableFormModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

import {
  fetchZones,
  createZone,
  updateZoneApi,
  deleteZoneApi,
  createTable,
  updateTableApi,
  deleteTableApi,
  bulkUpdateTablesLayout,
} from "./map-editor.service";

import type { EditorZone, EditorTable, TableStatus } from "./map-editor.types";

interface MapEditorFeatureProps {
  branchId: string;
}

export function MapEditorFeature({ branchId }: MapEditorFeatureProps) {
  const { success, error: showError } = useToast();

  // Data state
  const [branchName, setBranchName] = useState("");
  const [zones, setZones] = useState<EditorZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

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
    data?: { table_number: string; capacity: number; status: TableStatus; width?: number; height?: number; shape?: "RECTANGLE"|"CIRCLE" } | null;
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
      const res = await fetchZones(branchId);
      if (res.success) {
        setBranchName(res.data.branch_name);
        setZones(res.data.zones);
        // Auto-select first zone if none selected
        if (!selectedZoneId && res.data.zones.length > 0) {
          setSelectedZoneId(res.data.zones[0]._id);
        }
      }
    } catch (err) {
      showError("Không thể tải dữ liệu sơ đồ bàn.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // =============================================
  // ZONE CRUD HANDLERS
  // =============================================
  const handleCreateZone = async (data: { name: string; capacity: number }) => {
    const res = await createZone(branchId, data);
    if (res.success) {
      success(`Thêm khu vực "${data.name}" thành công!`);
      await loadZones();
      setSelectedZoneId(res.data._id);
    }
  };

  const handleUpdateZone = async (data: { name: string; capacity: number }) => {
    if (!zoneModal.zoneId) return;
    const res = await updateZoneApi(branchId, zoneModal.zoneId, data);
    if (res.success) {
      success("Cập nhật khu vực thành công!");
      await loadZones();
    }
  };

  const handleDeleteZone = async () => {
    const res = await deleteZoneApi(branchId, deleteModal.id);
    if (res.success) {
      success(`Xóa khu vực "${deleteModal.name}" thành công!`);
      if (selectedZoneId === deleteModal.id) {
        setSelectedZoneId(null);
      }
      await loadZones();
    }
  };

  // =============================================
  // TABLE CRUD HANDLERS
  // =============================================
  const handleCreateTable = async (data: { table_number: string; capacity: number }) => {
    if (!selectedZoneId) return;
    const res = await createTable(branchId, selectedZoneId, data);
    if (res.success) {
      success(`Thêm bàn "${data.table_number}" thành công!`);
      await loadZones();
    }
  };

  const handleUpdateTable = async (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: string }) => {
    if (!selectedZoneId || !tableModal.tableId) return;
    const res = await updateTableApi(branchId, selectedZoneId, tableModal.tableId, data);
    if (res.success) {
      success("Cập nhật bàn thành công!");
      await loadZones();
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteModal.parentId) return;
    const res = await deleteTableApi(branchId, deleteModal.parentId, deleteModal.id);
    if (res.success) {
      success(`Xóa bàn "${deleteModal.name}" thành công!`);
      await loadZones();
    }
  };

  const handleSaveLayout = async (tablesLayout: { _id: string; x: number; y: number }[]) => {
    if (!selectedZoneId) return;
    const res = await bulkUpdateTablesLayout(branchId, selectedZoneId, tablesLayout);
    if (res.success) {
      success("Lưu sơ đồ bàn thành công!");
      await loadZones();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center text-sm mb-2">
        <Link
          href="/admin/branches"
          className="text-gray-500 hover:text-amber-700 transition-colors"
        >
          Branch Management
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Map Editor</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/branches">
            <Button variant="outline" size="sm" className="bg-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sơ Đồ Bàn
            </h1>
            <p className="text-sm text-gray-500">
              {branchName || "Đang tải..."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={() => loadZones()}
          disabled={isLoading}
        >
          <RefreshCcw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <ZoneSidebar
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          isLoading={isLoading}
          onAddZone={() => setZoneModal({ open: true, mode: "create" })}
          onEditZone={(zone) =>
            setZoneModal({
              open: true,
              mode: "edit",
              data: { name: zone.name, capacity: zone.capacity },
              zoneId: zone._id,
            })
          }
          onDeleteZone={(zone) =>
            setDeleteModal({
              open: true,
              type: "zone",
              id: zone._id,
              name: zone.name,
            })
          }
        />

        {/* Table Canvas (Drag & Drop) */}
        <TableCanvas
          zone={selectedZone}
          onAddTable={() => setTableModal({ open: true, mode: "create" })}
          onSaveLayout={handleSaveLayout}
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
