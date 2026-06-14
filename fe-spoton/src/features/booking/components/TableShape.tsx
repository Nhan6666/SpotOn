import React from 'react';

export interface TableData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  status: 'AVAILABLE' | 'RESERVED';
  shape: 'RECTANGLE' | 'CIRCLE';
}

interface TableShapeProps {
  table: TableData;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (id: string) => void;
}

export function TableShape({ table, isSelected, isDisabled, onSelect }: TableShapeProps) {
  // Determine colors based on status and selection
  let bgColor = '';
  let borderColor = '';
  let shadow = '';

  if (isSelected) {
    bgColor = 'bg-red-500';
    borderColor = 'border-red-600';
    shadow = 'shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  } else if (isDisabled) {
    bgColor = 'bg-gray-200';
    borderColor = 'border-gray-300';
    shadow = '';
  } else if (table.status === 'RESERVED') {
    bgColor = 'bg-purple-500';
    borderColor = 'border-purple-600';
    shadow = 'shadow-sm';
  } else {
    // AVAILABLE
    bgColor = 'bg-blue-500 hover:bg-blue-400';
    borderColor = 'border-blue-600';
    shadow = 'hover:shadow-md';
  }

  // Common styles
  const baseClasses = `absolute cursor-pointer border-2 transition-all duration-200 ${bgColor} ${borderColor} ${shadow}`;
  const shapeClasses = table.shape === 'CIRCLE' ? 'rounded-full' : 'rounded-lg';
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  // Calculate chairs (dots around the table)
  // Just a simple visual representation
  const renderChairs = () => {
    const chairs = [];
    const chairSize = 12; // px
    const chairOffset = -8; // px outside the table

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

    // Color the chairs based on the table status (for simplicity, we just use lighter versions of table color)
    let chairBg = 'bg-blue-300';
    if (isSelected) chairBg = 'bg-red-300';
    else if (isDisabled) chairBg = 'bg-gray-300';
    else if (table.status === 'RESERVED') chairBg = 'bg-purple-300';

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
        if (!isDisabled && table.status === 'AVAILABLE') {
          onSelect(table.id);
        }
      }}
      title={`Bàn ${table.id} - ${table.capacity} người`}
    >
      {renderChairs()}
      {/* Table number inside */}
      <span className="text-white font-bold text-sm z-10">{table.id}</span>
    </div>
  );
}
