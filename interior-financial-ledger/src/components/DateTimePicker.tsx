/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO string or similar
  onChange: (newValue: string) => void;
  label?: string;
  className?: string;
}

export default function DateTimePicker({ value, onChange, label, className = '' }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parseDate = (val: string) => {
    try {
      const d = val ? new Date(val) : new Date();
      if (isNaN(d.getTime())) return new Date();
      return d;
    } catch {
      return new Date();
    }
  };

  const [tempDate, setTempDate] = useState<Date>(parseDate(value));

  useEffect(() => {
    setTempDate(parseDate(value));
  }, [value]);

  // Handle outside clicks to close the popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date-time for display
  const formatDisplay = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');

    return `${day} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const formattedValue = formatDisplay(parseDate(value));

  // Extract separate parts for the popup controls
  const dateStr = tempDate.toISOString().slice(0, 10);
  let rawHours = tempDate.getHours();
  const minutes = tempDate.getMinutes();
  const isPM = rawHours >= 12;
  const displayHour = rawHours % 12 === 0 ? 12 : rawHours % 12;

  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    const [year, month, day] = newDateStr.split('-').map(Number);
    const newDate = new Date(tempDate);
    newDate.setFullYear(year, month - 1, day);
    setTempDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleHourChange = (h: number) => {
    const newDate = new Date(tempDate);
    let finalHour = h;
    if (isPM && h !== 12) finalHour += 12;
    if (!isPM && h === 12) finalHour = 0;
    newDate.setHours(finalHour);
    setTempDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleMinuteChange = (m: number) => {
    const newDate = new Date(tempDate);
    newDate.setMinutes(m);
    setTempDate(newDate);
    onChange(newDate.toISOString());
  };

  const toggleAMPM = () => {
    const newDate = new Date(tempDate);
    const currentH = newDate.getHours();
    if (currentH >= 12) {
      newDate.setHours(currentH - 12);
    } else {
      newDate.setHours(currentH + 12);
    }
    setTempDate(newDate);
    onChange(newDate.toISOString());
  };

  const setToday = () => {
    const today = new Date();
    const newDate = new Date(tempDate);
    newDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    setTempDate(newDate);
    onChange(newDate.toISOString());
  };

  const setNow = () => {
    const now = new Date();
    setTempDate(now);
    onChange(now.toISOString());
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {label && (
        <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden cursor-pointer flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-500/50 transition-all font-semibold text-xs"
      >
        <span className="truncate">{formattedValue}</span>
        <CalendarIcon className="h-4 w-4 text-slate-400 dark:text-amber-500/60 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-amber-500/20 rounded-2xl shadow-xl z-50 space-y-4 text-xs font-semibold max-w-sm sm:w-80">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-amber-500/60 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Configure Date & Time
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-400"
            >
              Done
            </button>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Select Date</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-2 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-hidden text-xs"
            />
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Hour</label>
              <select
                value={displayHour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="w-full p-2 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-hidden text-xs"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Min</label>
              <select
                value={minutes}
                onChange={(e) => handleMinuteChange(Number(e.target.value))}
                className="w-full p-2 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-hidden text-xs"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                onClick={toggleAMPM}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-amber-400 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs font-black"
              >
                {isPM ? 'PM' : 'AM'}
              </button>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-900">
            <button
              type="button"
              onClick={setToday}
              className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 transition-colors uppercase tracking-wider font-extrabold"
            >
              Today
            </button>
            <button
              type="button"
              onClick={setNow}
              className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 transition-colors uppercase tracking-wider font-extrabold"
            >
              Current Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
