import React from 'react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, hint }) => (
  <div className="panel flex items-center gap-4 p-3.5 sm:p-4">
    <div className="hidden h-11 w-11 shrink-0 sm:grid place-items-center rounded-xl border border-blade-500/20 bg-blade-500/10">
      <Icon className="h-5 w-5 text-blade-400" />
    </div>
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{label}</div>
      <div className="mt-0.5 truncate text-lg font-bold sm:text-xl tabular-nums">{value}</div>
      {hint && <div className="truncate text-[11px] text-ink-400">{hint}</div>}
    </div>
  </div>
);

export default StatCard;
