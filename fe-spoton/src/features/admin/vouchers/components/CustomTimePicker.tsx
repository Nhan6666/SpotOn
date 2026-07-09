import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

function TimeSelect({ value, onChange, options, disabled }: { value: string, onChange: (val: string) => void, options: string[], disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="bg-transparent border-none focus:ring-0 text-sm disabled:text-slate-500 outline-none cursor-pointer text-center hover:bg-slate-100 rounded px-1 py-1 min-w-[2rem]"
            >
                {value}
            </button>
            {open && !disabled && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-14 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50 py-1 no-scrollbar">
                    {options.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-center px-2 py-1.5 text-sm hover:bg-slate-100 transition-colors ${value === opt ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function CustomTimePicker({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
    const [h, m] = value ? value.split(':') : ['00', '00'];
    const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="relative flex items-center shrink-0 border-l border-slate-200 px-2 py-1">
            <TimeSelect disabled={disabled} value={h} options={hours} onChange={newH => onChange(`${newH}:${m}`)} />
            <span className="text-slate-400 font-medium mx-0.5">:</span>
            <TimeSelect disabled={disabled} value={m} options={minutes} onChange={newM => onChange(`${h}:${newM}`)} />
            <Clock size={16} className="text-slate-400 ml-1 pointer-events-none" />
        </div>
    );
}
