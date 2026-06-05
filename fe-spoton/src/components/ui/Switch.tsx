import React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', label, ...props }, ref) => {
    return (
      <label className={`flex items-center cursor-pointer ${className}`}>
        <div className="relative">
          <input type="checkbox" className="sr-only" ref={ref} {...props} />
          <div className={`block w-10 h-6 rounded-full transition-colors ${props.checked ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${props.checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        {label && <div className="ml-3 font-medium text-gray-900 text-sm">{label}</div>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';
