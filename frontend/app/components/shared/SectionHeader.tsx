"use client";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-normal">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
