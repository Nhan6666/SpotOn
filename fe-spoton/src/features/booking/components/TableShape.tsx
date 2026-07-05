import React from 'react';
import { TABLE_STATUS_CONFIG, TableStatus } from '../../admin/map-editor/map-editor.types';

export interface TableData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  status: TableStatus;
  shape: 'RECTANGLE' | 'CIRCLE';
  table_number?: string;
  image_url?: string | null;
}

interface TableShapeProps {
  table: TableData;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (id: string) => void;
  allowAllStatuses?: boolean;
}

export function TableShape({ table, isSelected, isDisabled, onSelect, allowAllStatuses }: TableShapeProps) {
  // Determine colors based on status and selection
  let bgColor = '';
  let borderColor = '';
  let shadow = '';

  const config = TABLE_STATUS_CONFIG[table.status] || TABLE_STATUS_CONFIG.EMPTY;

  if (isSelected) {
    bgColor = 'bg-red-100';
    borderColor = 'border-red-500';
    shadow = 'shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20';
  } else if (isDisabled) {
    bgColor = 'bg-gray-100';
    borderColor = 'border-gray-200';
    shadow = '';
  } else {
    bgColor = config.bg;
    borderColor = config.border;
    shadow = table.status === 'EMPTY' ? 'hover:shadow-md' : 'shadow-sm';
  }

  // Common styles
  const isImage = !!table.image_url;
  const extraClass = config.extraClass || '';
  const baseClasses = `absolute cursor-pointer transition-all duration-200 ${isImage ? 'bg-transparent border-transparent' : `border-2 ${bgColor} ${borderColor}`} ${shadow} ${extraClass}`;
  const shapeClasses = table.shape === 'CIRCLE' ? 'rounded-full' : 'rounded-lg';
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  // Calculate chairs (dots around the table)
  // Just a simple visual representation
  const renderChairs = () => {
    if (table.image_url) return null; // Don't render CSS chairs if we have a table image

    const chairs = [];
    const chairSize = 8; // px
    const chairOffset = -5; // px outside the table

    if (table.shape === 'RECTANGLE') {
      let topCount = 0;
      let bottomCount = 0;
      let leftCount = 0;
      let rightCount = 0;
      
      if (table.capacity === 2) {
        topCount = 1;
        bottomCount = 1;
      } else if (table.capacity === 4) {
        topCount = 2;
        bottomCount = 2;
      } else if (table.capacity === 8) {
        topCount = 3;
        bottomCount = 3;
        leftCount = 1;
        rightCount = 1;
      } else {
        topCount = Math.ceil(table.capacity / 2);
        bottomCount = Math.floor(table.capacity / 2);
      }

      // Top chairs
      for (let i = 0; i < topCount; i++) {
        const cx = (table.width / (topCount + 1)) * (i + 1);
        chairs.push(<div key={`t-${i}`} className="absolute bg-blue-300 rounded-full" style={{ width: chairSize, height: chairSize, top: chairOffset, left: cx - chairSize/2 }} />);
      }
      // Bottom chairs
      for (let i = 0; i < bottomCount; i++) {
        const cx = (table.width / (bottomCount + 1)) * (i + 1);
        chairs.push(<div key={`b-${i}`} className="absolute bg-blue-300 rounded-full" style={{ width: chairSize, height: chairSize, bottom: chairOffset, left: cx - chairSize/2 }} />);
      }
      // Left chairs
      for (let i = 0; i < leftCount; i++) {
        const cy = (table.height / (leftCount + 1)) * (i + 1);
        chairs.push(<div key={`l-${i}`} className="absolute bg-blue-300 rounded-full" style={{ width: chairSize, height: chairSize, left: chairOffset, top: cy - chairSize/2 }} />);
      }
      // Right chairs
      for (let i = 0; i < rightCount; i++) {
        const cy = (table.height / (rightCount + 1)) * (i + 1);
        chairs.push(<div key={`r-${i}`} className="absolute bg-blue-300 rounded-full" style={{ width: chairSize, height: chairSize, right: chairOffset, top: cy - chairSize/2 }} />);
      }
    } else {
      // Circle chairs
      for (let i = 0; i < table.capacity; i++) {
        const angle = (i / table.capacity) * Math.PI * 2;
        const radius = table.width / 2 + 10; // table radius + offset
        const cx = table.width / 2 + Math.cos(angle) * radius;
        const cy = table.height / 2 + Math.sin(angle) * radius;
        chairs.push(<div key={`c-${i}`} className="absolute bg-blue-300 rounded-full" style={{ width: chairSize, height: chairSize, left: cx - chairSize/2, top: cy - chairSize/2 }} />);
      }
    }

    let chairBg = 'bg-blue-300';
    if (isSelected) chairBg = 'bg-red-400';
    else if (isDisabled) chairBg = 'bg-gray-200';
    else chairBg = config.border.replace('border-', 'bg-');

    return chairs.map((chair: any) => React.cloneElement(chair, { className: `${chair.props.className.replace('bg-blue-300', chairBg)}` }));
  };

  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${disabledClasses} flex items-center justify-center`}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
        zIndex: isSelected ? 10 : 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDisabled && (allowAllStatuses || table.status === 'EMPTY')) {
          onSelect(table.id);
        }
      }}
      title={`Bàn ${table.id} - ${table.capacity} người`}
    >
      {renderChairs()}
      {table.image_url ? (
        <>
          <img 
            src={table.image_url} 
            alt={`Bàn ${table.table_number || table.id}`} 
            className={`w-full h-full object-contain pointer-events-none p-1 ${shapeClasses}`}
            draggable={false}
          />
          <div className={`absolute inset-0 border-4 ${borderColor} ${shapeClasses} pointer-events-none opacity-80`} />
          <span className="absolute bg-white/90 px-2 py-0.5 rounded shadow-sm text-gray-800 font-bold text-xs z-10">
            {table.table_number || table.id}
          </span>
        </>
      ) : (
        <span className="text-white font-bold text-sm z-10">{table.table_number || table.id}</span>
      )}
    </div>
  );
}
