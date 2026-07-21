"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  location: { type: string; coordinates: [number, number] }; // [lng, lat]
  onChange: (coordinates: [number, number]) => void;
}

// Sub-component to handle map clicks
function LocationMarker({ position, onChange }: { position: [number, number], onChange: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      // Leaflet uses [lat, lng], but our DB uses [lng, lat]
      onChange([e.latlng.lng, e.latlng.lat]);
    },
  });

  return position === null ? null : (
    <Marker position={[position[1], position[0]]} />
  );
}

// Sub-component to fly to the current position
function FlyToCurrentLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([position[1], position[0]], 15);
  }, [position, map]);
  return null;
}

export default function MapLocationPicker({ location, onChange }: MapLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Cần Thơ')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        onChange([lon, lat]);
      }
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange([longitude, latitude]);
      },
      (error) => {
        console.error('Lỗi lấy vị trí:', error);
        alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.');
      },
      { enableHighAccuracy: true }
    );
  };

  const currentPos = location?.coordinates?.length === 2 
    ? (location.coordinates as [number, number])
    : [105.783, 10.033] as [number, number]; // Fallback to Can Tho [lng, lat]
    
  console.log('MapLocationPicker loaded with pos:', currentPos);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm địa điểm (VD: Đại học Cần Thơ)..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
        />
        <button 
          type="button" 
          onClick={handleSearch}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Tìm kiếm
        </button>
        <button 
          type="button" 
          onClick={handleGetCurrentLocation}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
          title="Lấy vị trí hiện tại của tôi"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300 relative z-0">
        {mounted ? (
          <MapContainer 
            center={[currentPos[1], currentPos[0]]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={currentPos} onChange={onChange} />
            <FlyToCurrentLocation position={currentPos} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
            Đang tải bản đồ...
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
        <span className="font-medium text-gray-700">Vị trí hiện tại:</span>
        <span>Kinh độ (Lng): <strong className="text-amber-600">{currentPos[0].toFixed(6)}</strong></span>
        <span>Vĩ độ (Lat): <strong className="text-amber-600">{currentPos[1].toFixed(6)}</strong></span>
      </div>
    </div>
  );
}
