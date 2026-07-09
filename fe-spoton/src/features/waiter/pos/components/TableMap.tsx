import React from 'react';
import { Users } from 'lucide-react';
import { Zone, Table } from '../pos.types';

interface TableMapProps {
  zones: Zone[];
  selectedZone: string | null;
  setSelectedZone: (zoneId: string) => void;
  setSelectedTable: (table: Table) => void;
}

export function TableMap({ zones, selectedZone, setSelectedZone, setSelectedTable }: TableMapProps) {
  const currentZone = zones.find(z => z._id === selectedZone);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 mb-4 flex-shrink-0">
        {zones.map(zone => (
          <button
            key={zone._id}
            onClick={() => setSelectedZone(zone._id)}
            className={`px-5 py-2.5 rounded-t-lg font-bold transition-colors whitespace-nowrap text-sm ${
              selectedZone === zone._id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-b-0 border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {zone.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto pr-2 pb-10 bg-gray-50 rounded-xl relative">
        <div 
          className="relative min-w-[1000px] min-h-[700px] w-full h-full border border-gray-200 bg-white shadow-inner" 
          style={{ 
            backgroundSize: '40px 40px', 
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)' 
          }}
        >
          {currentZone?.tables.map(table => {
            const isEmpty = table.status === 'EMPTY' || !table.status;
            const isOccupied = table.status === 'OCCUPIED';
            const isCleaning = table.status === 'CLEANING';
            const isMaintenance = table.status === 'MAINTENANCE';

            return (
              <button
                key={table._id}
                onClick={() => setSelectedTable(table)}
                style={{
                  position: 'absolute',
                  left: `${table.x || 0}px`,
                  top: `${table.y || 0}px`,
                  width: `${table.width || 80}px`,
                  height: `${table.height || 80}px`,
                  borderRadius: table.shape === 'CIRCLE' ? '50%' : '12px'
                }}
                className={`flex flex-col items-center justify-center transition-all shadow-sm hover:shadow-md border-2 overflow-hidden ${
                  isEmpty ? 'bg-white border-green-400 hover:border-green-500 hover:bg-green-50' :
                  isOccupied ? 'bg-blue-50 border-blue-400' :
                  isCleaning ? 'bg-amber-50 border-amber-400' :
                  isMaintenance ? 'bg-red-50 border-red-400' :
                  'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <span className="font-bold text-sm text-gray-800">{table.table_number}</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                  <Users className="w-3 h-3" /> {table.capacity}
                </span>
                <div className={`mt-1 text-[8px] uppercase font-bold px-1 rounded truncate w-full text-center ${
                  isEmpty ? 'bg-green-100 text-green-700' :
                  isOccupied ? 'bg-blue-100 text-blue-700' :
                  isCleaning ? 'bg-amber-100 text-amber-700' :
                  isMaintenance ? 'bg-red-100 text-red-700' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {isEmpty ? 'SẴN SÀNG' : 
                   isOccupied ? 'CÓ KHÁCH' : 
                   isCleaning ? 'DỌN DẸP' : 
                   isMaintenance ? 'BẢO TRÌ' : table.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
