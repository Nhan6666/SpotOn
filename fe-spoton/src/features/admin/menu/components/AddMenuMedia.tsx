import React, { useRef } from 'react';
import { Camera, Check, Lock, Plus, Tag, Info, X, Upload } from 'lucide-react';
import { ADMIN_TEXTS } from '@/constants/texts/admin';
import { useToast } from '@/components/ui/Toast';

interface AddMenuMediaProps {
  isCoreItem: boolean;
  setIsCoreItem: (val: boolean) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
}

export function AddMenuMedia({
  isCoreItem, setIsCoreItem,
  selectedTags, toggleTag,
  imageFile, setImageFile,
  imagePreview, setImagePreview,
}: AddMenuMediaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  const tags = [
    { id: 'chef', label: "Chef's Choice", icon: <Check className="w-3.5 h-3.5" /> },
    { id: 'vegan', label: 'Vegan', icon: <span className="text-[10px]">🌿</span> },
    { id: 'spicy', label: 'Spicy', icon: <span className="text-[10px]">🌶️</span> },
    { id: 'gluten', label: 'Gluten-Free', icon: <Check className="w-3.5 h-3.5" /> },
    { id: 'organic', label: 'Organic', icon: <span className="text-[10px]">🌱</span> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastError(ADMIN_TEXTS.menu.mediaUploadErrorType);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError(ADMIN_TEXTS.menu.mediaUploadErrorSize);
      return;
    }

    setImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 mb-24">
      {/* Media Upload Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-[#e67e22]">
            <Camera className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">{ADMIN_TEXTS.menu.mediaUploadTitle}</h2>
        </div>

        <div className="flex gap-8">
          {/* Primary Image */}
          <div className="flex-1 max-w-[280px]">
            <label className="block text-[13px] font-bold text-gray-700 mb-3">{ADMIN_TEXTS.menu.mediaPrimaryImage}</label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-white rounded-full shadow-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      title={ADMIN_TEXTS.menu.mediaBtnChangeImage}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="p-2.5 bg-white rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors"
                      title={ADMIN_TEXTS.menu.mediaBtnRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* File info badge */}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md">
                  {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ADMIN_TEXTS.menu.mediaUploadStatus}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 hover:border-[#e67e22] transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-[#fffbeb] flex items-center justify-center group-hover:bg-[#fef3c7] transition-colors">
                  <Camera className="w-7 h-7 text-[#d97706]" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-gray-700">{ADMIN_TEXTS.menu.mediaClickToUpload}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ADMIN_TEXTS.menu.mediaFormatInfo}</p>
                </div>
              </button>
            )}
          </div>
          
          {/* Gallery */}
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-gray-700 mb-3">{ADMIN_TEXTS.menu.mediaGalleryTitle}</label>
            <div className="flex gap-3 mb-4">
              {[1, 2, 3].map(i => (
                <button key={i} className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-colors">
                  <Plus className="w-6 h-6" strokeWidth={2} />
                </button>
              ))}
            </div>
            
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg p-4 flex items-start gap-3 mt-6">
              <Info className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[12px] text-[#b45309] leading-relaxed">
                {ADMIN_TEXTS.menu.mediaGalleryInfo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary & Attributes Card (Step 3 view) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-[#e67e22]">
            <Tag className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">{ADMIN_TEXTS.menu.mediaDietaryTitle}</h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button 
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 border transition-all ${
                  isSelected 
                    ? 'bg-[#fffbf2] border-[#f59e0b] text-[#d97706]' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tag.icon}
                {tag.label}
              </button>
            );
          })}
          <button className="px-4 py-2 rounded-full text-[13px] font-bold text-gray-500 border border-dashed border-gray-300 flex items-center gap-2 hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            {ADMIN_TEXTS.menu.mediaBtnAddTag}
          </button>
        </div>
      </div>

      {/* Review & Visibility */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-[#fffbeb] rounded-lg text-[#d97706]">
            <Lock className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">{ADMIN_TEXTS.menu.mediaReviewTitle}</h2>
            <p className="text-[13px] text-gray-500 mt-1 max-w-[450px] leading-relaxed">
              {ADMIN_TEXTS.menu.mediaReviewDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-[#e65100] tracking-widest text-right whitespace-pre-line">
            {ADMIN_TEXTS.menu.mediaCoreItem}
          </span>
          <button 
            onClick={() => setIsCoreItem(!isCoreItem)}
            className={`w-12 h-7 rounded-full flex items-center transition-colors px-1 ${isCoreItem ? 'bg-[#e67e22]' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${isCoreItem ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
}
