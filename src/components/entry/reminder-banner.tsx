"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { usePortfolio } from "@/lib/store";
import { shouldRemind, monthKey } from "@/lib/reminder";
import { useNewEntry } from "@/components/entry/new-entry-provider";
import { Button } from "@/components/ui/button";

const notifiedKey = (m: string) => `wealthos:notified:${m}`;
const dismissedKey = (m: string) => `wealthos:dismissed:${m}`;

// Nudges a monthly entry from the 10th onward. Fires a native browser
// notification once per month (only if permission is already granted — never
// auto-prompts) and shows an in-app banner either way.
export function ReminderBanner() {
  const { snapshots } = usePortfolio();
  const { openEntry } = useNewEntry();
  const [visible, setVisible] = useState(false);
  const [canAsk, setCanAsk] = useState(false);
  const month = monthKey(new Date());

  useEffect(() => {
    const due = shouldRemind(snapshots);
    const dismissed = localStorage.getItem(dismissedKey(month)) === "1";
    setVisible(due && !dismissed);
    setCanAsk(due && typeof Notification !== "undefined" && Notification.permission === "default");

    if (due && typeof Notification !== "undefined" && Notification.permission === "granted") {
      if (localStorage.getItem(notifiedKey(month)) !== "1") {
        new Notification("Update your portfolio", {
          body: "It's the 10th — log this month's entry to keep your net worth accurate.",
        });
        localStorage.setItem(notifiedKey(month), "1");
      }
    }
  }, [snapshots, month]);

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--warning)]/30 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-4 py-3 text-sm">
      <Bell className="h-4 w-4 shrink-0 text-[var(--warning)]" />
      <span className="min-w-0 flex-1 text-[var(--fg-muted)]">
        Time to update this month&apos;s portfolio numbers.
      </span>
      {canAsk && (
        <button
          onClick={() => Notification.requestPermission().then(() => setCanAsk(false))}
          className="hidden shrink-0 text-xs text-[var(--fg-subtle)] underline hover:text-[var(--fg)] sm:inline"
        >
          Enable alerts
        </button>
      )}
      <Button size="sm" onClick={openEntry}>
        Log entry
      </Button>
      <button
        onClick={() => {
          localStorage.setItem(dismissedKey(month), "1");
          setVisible(false);
        }}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-subtle)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
