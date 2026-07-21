"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddBranchForm } from "./components/AddBranchForm";
import { AddBranchOperations } from "./components/AddBranchOperations";
import { AddBranchImages } from "./components/AddBranchImages";
import { useAuth } from "@/providers/AuthProvider";
import { Map } from "lucide-react";
import { useBranchContext } from "./branch-management.context";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ADMIN_TEXTS } from "@/constants/texts/admin";

export function EditBranchFeature({ branchId }: { branchId: string }) {
  const { updateBranch } = useBranchContext();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [pendingBookingCount, setPendingBookingCount] = useState(0);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    address: {
      full: "",
      city: "Cần Thơ",
      district: "",
      ward: "",
      street: ""
    },
    location: {
      type: "Point",
      coordinates: [105.783, 10.033]
    },
    hotline: "",
    manager_id: "",
    manager_name: "",
    service_periods: {
      lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
      dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
    },
    status: "OPEN" as "OPEN" | "FULL" | "CLOSED",
    overload_threshold: 85,
    amenities: [] as string[],
    description: "",
  });

  // Fetch branch data trực tiếp từ API theo branchId
  useEffect(() => {
    const fetchBranch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/branches/${branchId}`);
        const result = await response.json();
        if (result.success && result.data) {
          const b = result.data;
          setFormData({
            name: b.name || "",
            address: b.address || {
              full: "", city: "Cần Thơ", district: "", ward: "", street: ""
            },
            location: b.location || {
              type: "Point", coordinates: [105.783, 10.033]
            },
            hotline: b.hotline || "",
            // manager_id có thể là object (sau populate) hoặc string (ObjectId)
            manager_id:
              typeof b.manager_id === "object" && b.manager_id
                ? b.manager_id._id
                : b.manager_id || "",
            manager_name: typeof b.manager_id === "object" && b.manager_id ? b.manager_id.full_name : "",
            service_periods: b.service_periods || {
              lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
              dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
            },
            status: b.status || "OPEN",
            overload_threshold: b.overload_threshold || 85,
            amenities: b.amenities?.map((a: any) => typeof a === 'string' ? a : a._id) || [],
            description: b.description || "",
          });
          if (b.images && b.images.length > 0) {
            setExistingImages(b.images);
          }
        }
      } catch (error) {
        console.error("Failed to fetch branch:", error);
        showError(ADMIN_TEXTS.editBranch.errorFetch);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranch();
  }, [branchId]);

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.address.full || !formData.address.district) {
      showError(ADMIN_TEXTS.editBranch.errorValidation);
      return;
    }

    if (!formData.manager_id) {
      showError(ADMIN_TEXTS.editBranch.errorManager);
      return;
    }

    // UC-6.4: Cảnh báo nếu chuyển sang CLOSED mà vẫn còn đơn chờ
    if (formData.status === 'CLOSED') {
      try {
        const response = await fetch(`/api/v1/bookings?branch_id=${branchId}`);
        const result = await response.json();
        if (result.success && result.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const pendingBookings = result.data.filter((b: any) => 
            ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.reservation_date || b.created_at) >= today
          );
          if (pendingBookings.length > 0) {
            setPendingBookingCount(pendingBookings.length);
            setShowCloseWarning(true);
            return;
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra bookings:", error);
      }
    }

    await performUpdate();
  };

  const performUpdate = async () => {
    setIsSaving(true);
    try {
      await updateBranch(branchId, formData);
      success(`${ADMIN_TEXTS.editBranch.successUpdate} "${formData.name}"`);
      if (user?.role !== 'MANAGER') {
        router.push("/admin/branches");
      }
    } catch (error) {
      showError(ADMIN_TEXTS.editBranch.errorUpdate);
    } finally {
      setIsSaving(false);
      setShowCloseWarning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs - Only show for Admin */}
      {user?.role !== 'MANAGER' && (
        <div className="flex items-center text-sm mb-6">
          <Link
            href="/admin/branches"
            className="text-gray-500 hover:text-amber-700 transition-colors font-medium"
          >
            {ADMIN_TEXTS.editBranch.breadcrumbList}
          </Link>
          <span className="mx-3 text-gray-300">/</span>
          <span className="font-semibold text-gray-900">
            {ADMIN_TEXTS.editBranch.breadcrumbEdit}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {user?.role === 'MANAGER' ? `${ADMIN_TEXTS.editBranch.titleManager} ` : `${ADMIN_TEXTS.editBranch.titleAdmin} `}
            <span className="font-medium text-gray-600">
              {formData.name || ADMIN_TEXTS.editBranch.loadingName}
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            {ADMIN_TEXTS.editBranch.subtitle}
          </p>
        </div>
        {user?.role === 'MANAGER' && (
          <div className="flex items-center gap-3">
            <Link href={`/manager/branch/map-editor`}>
              <Button variant="outline" className="shadow-sm flex items-center gap-2">
                <Map className="w-4 h-4" />
                {ADMIN_TEXTS.editBranch.btnEditMap}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <AddBranchForm
          formData={formData}
          updateFormData={updateFormData}
          currentBranchId={branchId}
          disabled={user?.role === "MANAGER"}
        />
        <div className="flex flex-col gap-8">
          <AddBranchOperations
            formData={formData}
            updateFormData={updateFormData}
            disabled={false}
          />
          <AddBranchImages 
            branchId={branchId} 
            mode="edit" 
            existingImages={existingImages}
            onImagesUpdated={(newImages) => setExistingImages(newImages)}
          />
        </div>
      </div>

      <div className="flex justify-end items-center mt-8 pb-12 pt-6 border-t border-gray-200 gap-4">
        {user?.role !== 'MANAGER' && (
          <Link href="/admin/branches">
            <Button
              variant="outline"
              className="w-32 bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              {ADMIN_TEXTS.editBranch.btnCancel}
            </Button>
          </Link>
        )}
        <Button
          variant="primary"
          className="bg-amber-700 hover:bg-amber-800 text-white border-0"
          onClick={handleUpdate}
          disabled={isSaving}
        >
          {isSaving ? ADMIN_TEXTS.editBranch.btnSaving : ADMIN_TEXTS.editBranch.btnSave}
        </Button>
      </div>

      {/* UC-6.4: Warning Modal */}
      {showCloseWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{ADMIN_TEXTS.editBranch.warningTitle}</h3>
            <p className="text-gray-600 mb-6">
              {ADMIN_TEXTS.editBranch.warningDesc1} <strong className="text-red-600">{pendingBookingCount}</strong> {ADMIN_TEXTS.editBranch.warningDesc2}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCloseWarning(false)}>{ADMIN_TEXTS.editBranch.warningBtnCancel}</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={performUpdate}>{ADMIN_TEXTS.editBranch.warningBtnClose}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
