export const SYNC_FREQUENCIES = [
  { value: 900, label: "Every 15 minutes" },
  { value: 3600, label: "Every hour" },
  { value: 21600, label: "Every 6 hours" },
  { value: 43200, label: "Every 12 hours" },
  { value: 86400, label: "Every 24 hours" },
] as const;

export function getSyncFrequencyLabel(seconds: number): string {
  return SYNC_FREQUENCIES.find((f) => f.value === seconds)?.label ?? `Every ${seconds}s`;
}
