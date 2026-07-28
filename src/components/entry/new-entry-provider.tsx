"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { EntryForm } from "@/components/entry/entry-form";

const Ctx = createContext<{ openEntry: () => void } | null>(null);

export const useNewEntry = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNewEntry must be used within NewEntryProvider");
  return ctx;
};

// Single shared "New entry" drawer — the Topbar button and the monthly
// reminder banner both trigger this same instance.
export function NewEntryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openEntry: () => setOpen(true) }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Drawer open={open} onClose={() => setOpen(false)} title="New entry">
        <EntryForm onDone={() => setOpen(false)} />
      </Drawer>
    </Ctx.Provider>
  );
}
