"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { demoMode } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  async function sendOtp() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    setMsg(error ? error.message : null);
    if (!error) setSent(true);
  }

  async function verifyOtp() {
    if (!supabase) return;
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) setMsg(error.message);
    else router.push("/dashboard");
  }

  async function oauth(provider: "google" | "apple") {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-lg font-bold text-white">
            W
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Wealth<span className="brand-gradient-text">OS</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">Your Net Worth Operating System</p>
        </div>

        {demoMode ? (
          <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
            <p className="text-sm text-[var(--fg-muted)]">
              Running in demo mode — no backend configured yet. Explore the sample portfolio.
            </p>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Enter WealthOS <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
            {!sent ? (
              <>
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3">
                  <Mail className="h-4 w-4 text-[var(--fg-subtle)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-subtle)]"
                  />
                </div>
                <Button className="w-full" onClick={sendOtp} disabled={!email}>
                  Continue with email
                </Button>
              </>
            ) : (
              <>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-center text-lg tracking-[0.4em] outline-none"
                />
                <Button className="w-full" onClick={verifyOtp} disabled={otp.length < 6}>
                  Verify & continue
                </Button>
              </>
            )}

            <div className="flex items-center gap-3 py-1 text-xs text-[var(--fg-subtle)]">
              <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <Button variant="secondary" className="w-full" onClick={() => oauth("google")}>
              Continue with Google
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => oauth("apple")}>
              Continue with Apple
            </Button>
            {msg && <p className="text-center text-xs text-[var(--negative)]">{msg}</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
