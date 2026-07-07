"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/Switch';
import { Amenity, CreateAmenityDto } from '../amenities.types';
import { amenitiesService } from '../amenities.service';
import { ADMIN_TEXTS } from '@/constants/texts/admin';
// Icon renderer dynamically if possible, or fallback to text. We will just show the icon name as text for simplicity or import lucide dynamically
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export function AmenitiesFeature() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAmenityDto>({ name: '', icon: 'CheckCircle', description: '' });
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const data = await amenitiesService.getAll();
      setAmenities(data);
    } catch (error) {
      console.error('Failed to load amenities:', error);
      showError(ADMIN_TEXTS.amenities.errLoadAmenities);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (amenity?: Amenity) => {
    if (amenity) {
      setEditingId(amenity._id);
      setFormData({ name: amenity.name, icon: amenity.icon, description: amenity.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', icon: 'CheckCircle', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showError(ADMIN_TEXTS.amenities.errRequireName);
      return;
    }

    try {
      if (editingId) {
        const updated = await amenitiesService.update(editingId, formData);
        setAmenities(prev => prev.map(a => a._id === editingId ? updated : a));
        success(ADMIN_TEXTS.amenities.successUpdate);
      } else {
        const created = await amenitiesService.create(formData);
        setAmenities(prev => [created, ...prev]);
        success(ADMIN_TEXTS.amenities.successCreate);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Submit error:', error);
      showError(error.message || ADMIN_TEXTS.amenities.errSubmit);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(ADMIN_TEXTS.amenities.confirmDelete.replace('{name}', name))) return;
    try {
      await amenitiesService.delete(id);
      setAmenities(prev => prev.filter(a => a._id !== id));
      success(ADMIN_TEXTS.amenities.successDelete);
    } catch (error: any) {
      console.error('Delete error:', error);
      showError(ADMIN_TEXTS.amenities.errDelete);
    }
  };

  const handleToggleStatus = async (amenity: Amenity) => {
    try {
      const updated = await amenitiesService.update(amenity._id, { is_active: !amenity.is_active });
      setAmenities(prev => prev.map(a => a._id === amenity._id ? updated : a));
    } catch (error) {
      console.error('Toggle error:', error);
      showError(ADMIN_TEXTS.amenities.errToggleStatus);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 flex flex-col gap-6 px-4 xl:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{ADMIN_TEXTS.amenities.title}</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">{ADMIN_TEXTS.amenities.subtitle}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          {ADMIN_TEXTS.amenities.btnAddAmenity}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">{ADMIN_TEXTS.amenities.loadingData}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ADMIN_TEXTS.amenities.tableColName}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ADMIN_TEXTS.amenities.tableColIcon}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ADMIN_TEXTS.amenities.tableColStatus}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{ADMIN_TEXTS.amenities.tableColActions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amenities.map(amenity => (
                <tr key={amenity._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mr-4">
                        <DynamicIcon name={amenity.icon} className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{amenity.name}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{amenity.description || ADMIN_TEXTS.amenities.noDescription}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {amenity.icon}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={amenity.is_active}
                      onChange={() => handleToggleStatus(amenity)}
                      label={amenity.is_active ? ADMIN_TEXTS.amenities.statusActive : ADMIN_TEXTS.amenities.statusInactive}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => handleOpenModal(amenity)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(amenity._id, amenity.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {amenities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    {ADMIN_TEXTS.amenities.emptyList}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingId ? ADMIN_TEXTS.amenities.modalTitleUpdate : ADMIN_TEXTS.amenities.modalTitleAdd}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{ADMIN_TEXTS.amenities.lblName} <span className="text-red-500">*</span></label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder={ADMIN_TEXTS.amenities.placeholderName}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{ADMIN_TEXTS.amenities.lblIcon}</label>
                <Input 
                  value={formData.icon}
                  onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                  placeholder={ADMIN_TEXTS.amenities.placeholderIcon}
                />
                <p className="text-xs text-gray-500 mt-1">{ADMIN_TEXTS.amenities.iconHint}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{ADMIN_TEXTS.amenities.lblDesc}</label>
                <Input 
                  value={formData.description || ''}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder={ADMIN_TEXTS.amenities.placeholderDesc}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>{ADMIN_TEXTS.amenities.btnCancel}</Button>
                <Button type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700">{ADMIN_TEXTS.amenities.btnSave}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
