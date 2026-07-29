"use client";

import { useState } from "react";
import { Cloud, CloudOff, Eye, EyeOff, HardDrive, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/field";
import { usePortfolio } from "@/lib/store";
import { usePrivacy } from "@/lib/privacy";
import { useNewEntry } from "@/components/entry/new-entry-provider";

export function Topbar() {
  const { sync } = usePortfolio();
  const { openEntry } = useNewEntry();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-4 backdrop-blur-xl md:px-6">
      <Button onClick={openEntry} size="sm">
        <Plus className="h-4 w-4" /> New entry
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <PrivacyToggle />
        {sync === "on" && (
          <Badge tone="positive">
            <Cloud className="h-3 w-3" /> Synced
          </Badge>
        )}
        {sync === "error" && (
          <Badge tone="warning" title="Sync is configured but unreachable — changes stay on this device until it reconnects.">
            <CloudOff className="h-3 w-3" /> Offline
          </Badge>
        )}
        {sync === "off" && (
          <Badge tone="neutral">
            <HardDrive className="h-3 w-3" /> Local
          </Badge>
        )}
      </div>
    </header>
  );
}

function PrivacyToggle() {
  const { masked, hasPassphrase, hide, setPassphraseAndHide, unlock } = usePrivacy();
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Setting one up is the only way hiding can ever be undone.
  const settingUp = !masked && !hasPassphrase;

  const close = () => {
    setOpen(false);
    setPassphrase("");
    setConfirm("");
    setError(null);
  };

  const click = () => {
    if (!masked && hasPassphrase) return hide(); // hiding never asks for it
    setOpen(true);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (settingUp) {
        if (passphrase.length < 4) return setError("Use at least 4 characters.");
        if (passphrase !== confirm) return setError("The two entries don't match.");
        await setPassphraseAndHide(passphrase);
      } else if (!(await unlock(passphrase))) {
        return setError("That's not it.");
      }
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={click}
        title={masked ? "Show amounts" : "Hide amounts"}
        aria-label={masked ? "Show amounts" : "Hide amounts"}
        className="grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
      >
        {masked ? <EyeOff className="h-4 w-4 text-[var(--warning)]" /> : <Eye className="h-4 w-4" />}
      </button>

      <Drawer open={open} onClose={close} title={settingUp ? "Hide amounts" : "Show amounts"}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="text-sm text-[var(--fg-muted)]">
            {settingUp
              ? "Amounts stay masked until this passphrase is entered. The passphrase itself is never stored — only a slow hash of it."
              : "Enter your passphrase to reveal amounts again."}
          </p>

          <Field label="Passphrase">
            <Input
              autoFocus
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </Field>

          {settingUp && (
            <Field label="Confirm passphrase">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          )}

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          {settingUp && (
            <p className="text-xs text-[var(--fg-subtle)]">
              There is no recovery. Forget it and you will have to clear this site&apos;s data,
              which also clears any entries that haven&apos;t synced.
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !passphrase}>
              {settingUp ? "Set and hide" : "Show amounts"}
            </Button>
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
