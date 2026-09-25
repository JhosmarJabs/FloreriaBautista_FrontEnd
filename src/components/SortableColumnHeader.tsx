import type { SortConfig } from '../hooks/useLocalSort';

interface Props {
  label: string;
  field: string;
  sortConfig: SortConfig;
  onToggle: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SortableColumnHeader({ label, field, sortConfig, onToggle, className = '', align = 'left' }: Props) {
  const isActive = sortConfig.field === field;

  return (
    <th
      className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer select-none group transition-colors
        ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
        ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
        ${className}`}
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIndicator active={isActive} order={isActive ? sortConfig.order : null} />
      </span>
    </th>
  );
}

function SortIndicator({ active, order }: { active: boolean; order: 'asc' | 'desc' | null }) {
  return (
    <span className={`inline-flex flex-col text-[8px] leading-none transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
      <span className={order === 'asc' ? 'text-emerald-500' : ''}>▲</span>
      <span className={order === 'desc' ? 'text-emerald-500' : ''}>▼</span>
    </span>
  );
}
