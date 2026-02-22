const statusStyles: Record<
  string,
  { bg: string; text: string }
> = {
  waiting: { bg: "bg-amber-100", text: "text-amber-800" },
  accepted: { bg: "bg-blue-100", text: "text-blue-800" },
  arrived: { bg: "bg-cyan-100", text: "text-cyan-800" },
  ontrip: { bg: "bg-primary/20", text: "text-primary" },
  ended: { bg: "bg-success/20", text: "text-success" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
  open: { bg: "bg-amber-100", text: "text-amber-800" },
  under_review: { bg: "bg-blue-100", text: "text-blue-800" },
  resolved: { bg: "bg-success/20", text: "text-success" },
  dismissed: { bg: "bg-gray-200", text: "text-gray-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-800" },
  active: { bg: "bg-success/20", text: "text-success" },
  inactive: { bg: "bg-gray-200", text: "text-gray-700" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  const display = label ?? status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize ${style.bg} ${style.text}`}
    >
      {display}
    </span>
  );
}
