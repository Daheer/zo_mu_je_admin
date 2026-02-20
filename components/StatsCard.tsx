import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#7F8C8D]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#2C3E50]">{value}</p>
        </div>
        {icon && (
          <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        )}
      </div>
    </div>
  );
}
