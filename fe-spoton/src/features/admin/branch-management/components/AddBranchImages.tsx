import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

interface AddBranchImagesProps {
  branchId: string;
  onComplete: () => void;
}

export function AddBranchImages({ branchId, onComplete }: AddBranchImagesProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 5 - files.length);
      
      const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== selectedFiles.length) {
        showError('Chỉ chấp nhận file ảnh.');
      }

      setFiles(prev => [...prev, ...validFiles]);
      const urls = validFiles.map(f => URL.createObjectURL(f));
      setPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      // Nếu không có ảnh, cứ hoàn tất bình thường
      onComplete();
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const res = await http.put<{ success: boolean; data: any }>(
        `/uploads/branch/${branchId}`,
        formData
      );
      
      if (res?.success) {
        success('Tải ảnh thành công!');
        onComplete();
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      showError('Tải ảnh thất bại. Bạn có thể cập nhật sau.');
      onComplete(); // Vẫn cho đi tiếp vì chi nhánh đã được tạo
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Branch Photos (Optional)</h2>
      <p className="text-sm text-gray-500 mb-6">Upload up to 5 photos to showcase the branch location.</p>
      
      <div className="space-y-6">
        {files.length < 5 && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                <Upload className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Click to upload photos</p>
            <p className="text-xs text-gray-500">JPG, PNG, WEBP (Max 5MB each)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button 
            variant="primary" 
            className="bg-amber-600 hover:bg-amber-700 text-white border-0" 
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : (files.length > 0 ? 'Upload & Finish' : 'Skip & Finish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
