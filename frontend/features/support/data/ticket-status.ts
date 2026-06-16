import type { TicketStatus } from "../api/support-api";

export type TicketStatusConfig = {
  label: string;
  variant: "muted" | "warning" | "success" | "danger" | "promotion";
};

export const TICKET_STATUSES: Record<TicketStatus, TicketStatusConfig> = {
  open: { label: "Open", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  answered: { label: "Answered", variant: "promotion" },
  closed: { label: "Closed", variant: "muted" },
  archived: { label: "Archived", variant: "muted" },
};

export function getTicketStatusLabel(status: string): string {
  return TICKET_STATUSES[status as TicketStatus]?.label ?? status;
}

export function getTicketStatusVariant(status: string): string {
  return TICKET_STATUSES[status as TicketStatus]?.variant ?? "muted";
}

export const TICKET_FILTER_TABS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
] as const;
