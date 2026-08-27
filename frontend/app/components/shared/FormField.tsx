"use client";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export default function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-600 font-medium uppercase tracking-wider text-[11px]">{label}</label>
      {children}
    </div>
  );
}
