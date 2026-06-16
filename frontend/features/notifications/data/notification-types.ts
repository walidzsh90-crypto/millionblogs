import type { NotificationType } from "../api/notifications-api";

export type NotificationTypeConfig = {
  label: string;
  variant: "muted" | "warning" | "success" | "danger" | "promotion";
  icon: string;
};

export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  system: { label: "System", variant: "muted", icon: "⚙" },
  promotion: { label: "Promotion", variant: "promotion", icon: "📣" },
  wallet: { label: "Wallet", variant: "success", icon: "💰" },
  subscription: { label: "Subscription", variant: "promotion", icon: "⭐" },
  badge: { label: "Badge", variant: "warning", icon: "🏆" },
  support: { label: "Support", variant: "warning", icon: "💬" },
};

export function getNotificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPES[type]?.label ?? type;
}

export function getNotificationTypeVariant(type: string): string {
  return NOTIFICATION_TYPES[type]?.variant ?? "muted";
}

const variantStyles: Record<string, string> = {
  muted: "bg-muted/20 text-muted border-muted/30",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  promotion: "bg-promotion/10 text-promotion border-promotion/20",
};

export function getTypeBadgeClass(type: string): string {
  return variantStyles[getNotificationTypeVariant(type)] ?? variantStyles.muted;
}

export const NOTIFICATION_FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "archived", label: "Archived" },
] as const;
