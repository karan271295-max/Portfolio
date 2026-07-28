"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// Right-side slide-over. Used for add/edit forms.
//
// Rendered via a portal into document.body: Safari/WebKit treats a `position:
// sticky` ancestor (the app's sticky Topbar) as a containing block for
// `position: fixed` descendants, which clips this drawer to the header's
// height. Portaling out from under any sticky/positioned ancestor sidesteps
// that entirely.
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
              <h2 className="text-sm font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5" style={{ WebkitOverflowScrolling: "touch" }}>
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
