import { useState, useRef, useEffect } from 'react';
import { BsCalendar } from 'react-icons/bs';

const presets = [
  { label: 'اليوم', getValue: () => { const d = new Date(); return { dateFrom: toDateStr(d), dateTo: toDateStr(d) }; } },
  { label: 'أمس', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { dateFrom: toDateStr(d), dateTo: toDateStr(d) }; } },
  { label: 'هذا الأسبوع', getValue: () => { const d = new Date(); const day = d.getDay(); const start = new Date(d); start.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return { dateFrom: toDateStr(start), dateTo: toDateStr(d) }; } },
  { label: 'هذا الشهر', getValue: () => { const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), 1); return { dateFrom: toDateStr(start), dateTo: toDateStr(d) }; } },
  { label: 'هذا العام', getValue: () => { const d = new Date(); const start = new Date(d.getFullYear(), 0, 1); return { dateFrom: toDateStr(start), dateTo: toDateStr(d) }; } },
];

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

const DateRangePicker = ({ value = { dateFrom: '', dateTo: '' }, onChange, presets: showPresets = true }) => {
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePreset = (preset) => {
    const range = preset.getValue();
    onChange(range);
    setShowMenu(false);
  };

  return (
    <div className="date-range-picker" ref={ref}>
      <div className="filter-date-inputs">
        <input
          className="form-control-custom"
          type="date"
          value={value.dateFrom}
          onChange={e => onChange({ ...value, dateFrom: e.target.value })}
          placeholder="من تاريخ"
        />
        <span className="date-range-separator">إلى</span>
        <input
          className="form-control-custom"
          type="date"
          value={value.dateTo}
          onChange={e => onChange({ ...value, dateTo: e.target.value })}
          placeholder="إلى تاريخ"
        />
        {showPresets && (
          <button className="btn-custom btn-custom-sm btn-custom-ghost" onClick={() => setShowMenu(p => !p)}>
            <BsCalendar size={14} />
          </button>
        )}
      </div>

      {showMenu && showPresets && (
        <div className="date-range-presets">
          {presets.map(p => (
            <button key={p.label} className="date-range-preset-btn" onClick={() => handlePreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
