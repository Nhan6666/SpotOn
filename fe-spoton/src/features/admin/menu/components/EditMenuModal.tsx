import React, { useState } from 'react';
import { MenuItem } from '../menu.types';
import { menuService } from '../menu.service';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

interface EditMenuModalProps {
  item: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMenuModal({ item, onClose, onSaved }: EditMenuModalProps) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [basePrice, setBasePrice] = useState(String(item.base_price));
  const [minPrice, setMinPrice] = useState(String(item.min_price));
  const [maxPrice, setMaxPrice] = useState(String(item.max_price));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await menuService.updateItem(item.menu_id, item._id, {
        name,
        description,
        base_price: parseFloat(basePrice),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
      });
      alert(ADMIN_TEXTS.menu.modalUpdateSuccess);
      onSaved();
    } catch (err: any) {
      setError(err.message || ADMIN_TEXTS.menu.modalUpdateError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{ADMIN_TEXTS.menu.modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{ADMIN_TEXTS.menu.modalItemName} <span className="text-red-500">*</span></label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{ADMIN_TEXTS.menu.modalDesc}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" rows={3}></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{ADMIN_TEXTS.menu.modalBasePrice} <span className="text-red-500">*</span></label>
              <input required type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{ADMIN_TEXTS.menu.modalMinPrice} <span className="text-red-500">*</span></label>
              <input required type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{ADMIN_TEXTS.menu.modalMaxPrice} <span className="text-red-500">*</span></label>
              <input required type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-lg">{ADMIN_TEXTS.menu.modalBtnCancel}</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {isLoading ? ADMIN_TEXTS.menu.modalBtnSaving : ADMIN_TEXTS.menu.modalBtnSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
