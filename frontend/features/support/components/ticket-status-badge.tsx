import { TICKET_STATUSES, type TicketStatusConfig } from "../data/ticket-status";

const variantStyles: Record<string, string> = {
  muted: "bg-muted/20 text-muted border-muted/30",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  promotion: "bg-promotion/10 text-promotion border-promotion/20",
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config: TicketStatusConfig =
    TICKET_STATUSES[status as keyof typeof TICKET_STATUSES] ?? {
      label: status,
      variant: "muted",
    };
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${variantStyles[config.variant]}`}
    >
      {config.label}
    </span>
  );
}
