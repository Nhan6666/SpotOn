"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw, PanelLeftClose, PanelLeft, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { http } from "@/lib/http";

import { ZoneSidebar } from "./components/ZoneSidebar";
import { TableTemplatesSidebar } from "./components/TableTemplatesSidebar";
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
  applyTemplateApi
} from "./map-editor.service";

import { fetchMapTemplates } from "../map-templates/map-template.service";

import type { EditorZone, EditorTable, TableStatus } from "./map-editor.types";
import { ADMIN_TEXTS } from "@/constants/texts/admin";

interface MapEditorFeatureProps {
  branchId: string;
}

export function MapEditorFeature({ branchId }: MapEditorFeatureProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  // Data state
  const [branchName, setBranchName] = useState("");
  const [zones, setZones] = useState<EditorZone[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

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

  const [importModal, setImportModal] = useState(false);
  const [importConfirm, setImportConfirm] = useState<{ open: boolean; templateId: string }>({ open: false, templateId: "" });
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  // Selected zone object
  const selectedZone = zones.find((z) => z._id === selectedZoneId) || null;

  // =============================================
  // FETCH DATA
  // =============================================
  const loadZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchZones(branchId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let activeBookings: any[] = [];
      try {
        const bookingsRes = await http.get<{ success: boolean; data: any[] }>(`/bookings?branch_id=${branchId}&start_date=${today.toISOString()}`);
        if (bookingsRes.success) {
          activeBookings = bookingsRes.data.filter(b => !['COMPLETED', 'CANCELLED', 'CANCELLED_TIMEOUT', 'NO_SHOW'].includes(b.status));
        }
      } catch (e) {}

      if (res.success) {
        setBranchName(res.data.branch_name);
        setZones(res.data.zones);
        setTemplates(res.data.table_templates || []);
        setBookings(activeBookings);
        // Auto-select first zone if none selected
        setSelectedZoneId((prev) => {
          if (!prev && res.data.zones.length > 0) {
            return res.data.zones[0]._id;
          }
          return prev;
        });
      }
    } catch (err) {
      showError(ADMIN_TEXTS.mapEditor.errorLoad);
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
      success(`${ADMIN_TEXTS.mapEditor.successCreateZone} "${data.name}" thành công!`);
      await loadZones();
      setSelectedZoneId(res.data._id);
    }
  };

  const handleUpdateZone = async (data: { name: string; capacity: number }) => {
    if (!zoneModal.zoneId) return;
    const res = await updateZoneApi(branchId, zoneModal.zoneId, data);
    if (res.success) {
      success(ADMIN_TEXTS.mapEditor.successUpdateZone);
      await loadZones();
    }
  };

  const handleDeleteZone = async () => {
    const res = await deleteZoneApi(branchId, deleteModal.id);
    if (res.success) {
      success(`${ADMIN_TEXTS.mapEditor.successDeleteZone} "${deleteModal.name}" thành công!`);
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
      success(`${ADMIN_TEXTS.mapEditor.successCreateTable} "${data.table_number}" thành công!`);
      await loadZones();
    }
  };

  const handleUpdateTable = async (data: { table_number: string; capacity: number; status?: TableStatus; width?: number; height?: number; shape?: string }) => {
    if (!selectedZoneId || !tableModal.tableId) return;
    const res = await updateTableApi(branchId, selectedZoneId, tableModal.tableId, data);
    if (res.success) {
      success(ADMIN_TEXTS.mapEditor.successUpdateTable);
      await loadZones();
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteModal.parentId) return;
    
    // Ngăn xóa nếu bàn đang có đơn đặt
    const tableBookings = bookings.filter(b => b.table_ids.includes(deleteModal.id));
    if (tableBookings.length > 0) {
      showError(`Không thể xóa bàn "${deleteModal.name}" vì đang có ${tableBookings.length} đơn đặt lịch hoạt động trong tương lai.`);
      setDeleteModal({ open: false, type: "zone", id: "", name: "" });
      return;
    }

    const res = await deleteTableApi(branchId, deleteModal.parentId, deleteModal.id);
    if (res.success) {
      success(`${ADMIN_TEXTS.mapEditor.successDeleteTable} "${deleteModal.name}" thành công!`);
      await loadZones();
    }
  };

  const handleSaveLayout = async (tablesLayout: { _id: string; x: number; y: number; width?: number; height?: number }[]) => {
    if (!selectedZoneId) return;
    const res = await bulkUpdateTablesLayout(branchId, selectedZoneId, tablesLayout);
    if (res.success) {
      success(ADMIN_TEXTS.mapEditor.successSaveLayout);
      await loadZones();
    }
  };

  const handleOpenImportModal = async () => {
    if (!selectedZoneId) {
      showError(ADMIN_TEXTS.mapEditor.errorSelectZoneFirst);
      return;
    }
    try {
      const res = await fetchMapTemplates();
      if (res.success) {
        setAvailableTemplates(res.data);
        setImportModal(true);
      }
    } catch (err) {
      showError(ADMIN_TEXTS.mapEditor.errorLoadTemplates);
    }
  };

  const handleImportTemplate = async (templateId: string) => {
    if (!selectedZoneId) return;
    try {
      const res = await applyTemplateApi(branchId, selectedZoneId, templateId);
      if (res.success) {
        success(ADMIN_TEXTS.mapEditor.successApplyTemplate);
        setImportConfirm({ open: false, templateId: "" });
        setImportModal(false);
        await loadZones();
      }
    } catch (err) {
      showError(ADMIN_TEXTS.mapEditor.errorApplyTemplate);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <Link href={user?.role === 'MANAGER' ? '/manager/branch' : '/admin/branches'}>
            <Button variant="outline" size="sm" className="bg-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {ADMIN_TEXTS.mapEditor.title}
            </h1>
            <p className="text-sm text-gray-500">
              {branchName || ADMIN_TEXTS.mapEditor.loading}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm hover:bg-gray-50"
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          >
            {showLeftSidebar ? (
              <><PanelLeftClose className="w-4 h-4 mr-1.5" /> {ADMIN_TEXTS.mapEditor.btnHideSidebar}</>
            ) : (
              <><PanelLeft className="w-4 h-4 mr-1.5" /> {ADMIN_TEXTS.mapEditor.btnShowSidebar}</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm hover:bg-gray-50"
            onClick={handleOpenImportModal}
          >
            <Download className="w-4 h-4 mr-1.5" /> {ADMIN_TEXTS.mapEditor.btnImportTemplate}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm hover:bg-gray-50"
            onClick={() => loadZones()}
            disabled={isLoading}
          >
            <RefreshCcw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {ADMIN_TEXTS.mapEditor.btnRefresh}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        {showLeftSidebar && (
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
        )}

        {/* Templates Sidebar */}
        <TableTemplatesSidebar 
          branchId={branchId}
          templates={templates} 
          onTemplateUpdate={loadZones}
        />

        {/* Table Canvas (Drag & Drop) */}
        <TableCanvas
          zone={selectedZone}
          bookings={bookings}
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
        tableId={tableModal.tableId}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: "zone", id: "", name: "" })}
        onConfirm={deleteModal.type === "zone" ? handleDeleteZone : handleDeleteTable}
        title={deleteModal.type === "zone" ? ADMIN_TEXTS.mapEditor.deleteZoneTitle : ADMIN_TEXTS.mapEditor.deleteTableTitle}
        description={
          deleteModal.type === "zone"
            ? ADMIN_TEXTS.mapEditor.deleteZoneDesc
            : ADMIN_TEXTS.mapEditor.deleteTableDesc
        }
        itemName={deleteModal.name}
      />

      {/* Import Template Modal */}
      {importModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{ADMIN_TEXTS.mapEditor.importModalTitle}</h3>
                <p className="text-xs text-red-500 mt-1">{ADMIN_TEXTS.mapEditor.importModalWarning}</p>
              </div>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {availableTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{ADMIN_TEXTS.mapEditor.importModalEmpty}</p>
              ) : (
                <div className="space-y-3">
                  {availableTemplates.map(tpl => (
                    <div key={tpl._id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => setImportConfirm({ open: true, templateId: tpl._id })}>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{tpl.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{tpl.description}</p>
                      </div>
                      <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">{ADMIN_TEXTS.mapEditor.importModalBtnSelect}</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <Button variant="outline" onClick={() => setImportModal(false)}>{ADMIN_TEXTS.mapEditor.importModalBtnCancel}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Import Modal */}
      {importConfirm.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{ADMIN_TEXTS.mapEditor.confirmImportTitle}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {ADMIN_TEXTS.mapEditor.confirmImportDesc1} <strong className="text-gray-700">{ADMIN_TEXTS.mapEditor.confirmImportDesc2}</strong> {ADMIN_TEXTS.mapEditor.confirmImportDesc3} &ldquo;{selectedZone?.name}&rdquo; {ADMIN_TEXTS.mapEditor.confirmImportDesc4}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setImportConfirm({ open: false, templateId: "" })}>{ADMIN_TEXTS.mapEditor.confirmImportBtnCancel}</Button>
              <Button variant="primary" className="flex-1 bg-amber-600 hover:bg-amber-700 border-0" onClick={() => handleImportTemplate(importConfirm.templateId)}>{ADMIN_TEXTS.mapEditor.confirmImportBtnConfirm}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
