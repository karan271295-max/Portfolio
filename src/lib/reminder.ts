import type { Snapshot } from "./types";

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const hasEntryThisMonth = (snapshots: Snapshot[], today: Date) =>
  snapshots.some((s) => monthKey(new Date(s.date)) === monthKey(today));

// True from the 10th onward, until this month's entry is logged.
export const shouldRemind = (snapshots: Snapshot[], today = new Date()) =>
  today.getDate() >= 10 && !hasEntryThisMonth(snapshots, today);
