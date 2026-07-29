"use client";

// Privacy mode: mask every rupee figure behind a passphrase, so the app can be
// shown to someone without showing what it holds.
//
// This is a screen guard, not encryption. The portfolio still lives in
// localStorage and in the page's own state, so anyone with devtools can read it.
// It stops shoulder-surfing and handing over an unlocked laptop — nothing more.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setMaskAmounts } from "./format";

const KEY = "wealthos:privacy:v1";
const ITERATIONS = 150_000;

interface Stored {
  masked: boolean;
  salt: string | null; // hex
  verifier: string | null; // hex, PBKDF2 of the passphrase
}

const BLANK: Stored = { masked: false, salt: null, verifier: null };

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((b) => parseInt(b, 16)));

/** PBKDF2-SHA256. Slow on purpose: a 4-digit PIN shouldn't fall in microseconds. */
export async function derive(passphrase: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return hex(bits);
}

export function newSalt(): string {
  return hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** True when the passphrase reproduces the stored verifier. */
export async function verify(passphrase: string, stored: Stored): Promise<boolean> {
  if (!stored.salt || !stored.verifier) return false;
  return (await derive(passphrase, unhex(stored.salt))) === stored.verifier;
}

interface Privacy {
  masked: boolean;
  hasPassphrase: boolean;
  /** Hide immediately — hiding never needs the passphrase. */
  hide: () => void;
  /** Set the passphrase (first use) and hide. */
  setPassphraseAndHide: (passphrase: string) => Promise<void>;
  /** Reveal. Resolves false on a wrong passphrase. */
  unlock: (passphrase: string) => Promise<boolean>;
}

const PrivacyContext = createContext<Privacy | null>(null);

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}

const read = (): Stored => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...BLANK, ...JSON.parse(raw) } : BLANK;
  } catch {
    return BLANK;
  }
};

const write = (s: Stored) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode — this session only */
  }
};

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<Stored>(BLANK);

  useEffect(() => {
    const s = read();
    setMaskAmounts(s.masked);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored(s);
  }, []);

  const save = useCallback((next: Stored) => {
    setMaskAmounts(next.masked);
    write(next);
    setStored(next);
  }, []);

  const value = useMemo<Privacy>(
    () => ({
      masked: stored.masked,
      hasPassphrase: Boolean(stored.verifier),
      hide: () => save({ ...stored, masked: true }),
      setPassphraseAndHide: async (passphrase: string) => {
        const salt = newSalt();
        const verifier = await derive(passphrase, unhex(salt));
        save({ masked: true, salt, verifier });
      },
      unlock: async (passphrase: string) => {
        if (!(await verify(passphrase, stored))) return false;
        save({ ...stored, masked: false });
        return true;
      },
    }),
    [stored, save],
  );

  // The mask is read by formatMoney rather than passed as a prop, so the whole
  // subtree is remounted on toggle — nothing can keep a stale figure on screen.
  return (
    <PrivacyContext.Provider value={value}>
      <div
        key={stored.masked ? "masked" : "clear"}
        className={stored.masked ? "contents privacy-masked" : "contents"}
      >
        {children}
      </div>
    </PrivacyContext.Provider>
  );
}
