"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { socket } from "@/lib/socket";
import { useToast } from "@/components/ui/Toast";

interface OverloadAlertData {
  capacityPercent: string;
  threshold: number;
  branchId: string;
}

export function GlobalOverloadAlert() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [alertData, setAlertData] = useState<OverloadAlertData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only apply to manager
    if (!user || user.role !== "MANAGER" || !user.branch_id) return;

    const handleOverloadAlert = (data: OverloadAlertData) => {
      // Validate the branch is for this manager
      if (data.branchId === user.branch_id) {
        setAlertData(data);
      }
    };

    socket.on("OVERLOAD_ALERT", handleOverloadAlert);

    return () => {
      socket.off("OVERLOAD_ALERT", handleOverloadAlert);
    };
  }, [user]);

  if (!alertData) return null;

  const handleSetFull = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/branches/${user?.branch_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Optional if cookies are used
        },
        body: JSON.stringify({ status: "FULL" }),
      });

      const data = await res.json();
      if (data.success) {
        success("Đã khóa đặt bàn thành công! Trạng thái chi nhánh: FULL.");
        setAlertData(null); // Hide alert
        setShowModal(false);
      } else {
        showError(data.message || "Lỗi khi cập nhật trạng thái chi nhánh.");
      }
    } catch (err) {
      console.error(err);
      showError("Lỗi hệ thống khi cập nhật trạng thái.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Red flashing banner */}
      <div className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-between w-full z-50 animate-pulse-slow border-b-4 border-red-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-300 animate-bounce" />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wide">
              Cảnh báo quá tải hệ thống!
            </h4>
            <p className="text-sm opacity-90">
              Công suất hiện tại: {alertData.capacityPercent}% (Ngưỡng an toàn: {alertData.threshold}%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-red-900 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider transition-colors shadow-sm"
          >
            Xử lý quá tải (Set FULL)
          </button>
          <button
            onClick={() => setAlertData(null)}
            className="text-white hover:text-red-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Xác nhận đóng kênh đặt bàn</h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Hành động này sẽ cập nhật trạng thái chi nhánh thành <strong>FULL</strong>. Hệ thống sẽ tự động vô hiệu hóa tính năng đặt bàn trên mọi nền tảng (Web/App) đối với khách hàng để ngăn quá tải.<br/><br/>
              Bạn có chắc chắn muốn thực hiện?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isProcessing}
                onClick={handleSetFull}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : (
                  "Đồng ý, chuyển sang FULL"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
