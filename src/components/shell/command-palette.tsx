"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";

type Ctx = { open: () => void; close: () => void };
const PaletteContext = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useCommandPalette = () => useContext(PaletteContext);

const commands = [
  { label: "Go to Dashboard", href: "/dashboard" },
  { label: "Entries", href: "/entries" },
  { label: "Accounts", href: "/assets" },
  { label: "Portfolio Analytics", href: "/analytics" },
  { label: "Liabilities", href: "/liabilities" },
  { label: "Goals", href: "/goals" },
  { label: "Smart Insights", href: "/insights" },
  { label: "Settings", href: "/settings" },
];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const ctx = useMemo<Ctx>(() => ({ open: () => setOpen(true), close: () => setOpen(false) }), []);

  return (
    <PaletteContext.Provider value={ctx}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
                <Search className="h-4 w-4 text-[var(--fg-subtle)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search…"
                  className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-subtle)]"
                />
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-[var(--fg-subtle)]">No results</p>
                )}
                {results.map((c) => (
                  <button
                    key={c.href}
                    onClick={() => {
                      router.push(c.href);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PaletteContext.Provider>
  );
}
