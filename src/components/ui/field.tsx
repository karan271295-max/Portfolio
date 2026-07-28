import { cn } from "@/lib/utils";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--fg-muted)]">{label}</span>
      {children}
    </label>
  );
}

const base =
  "h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition-colors focus:border-[var(--brand)] placeholder:text-[var(--fg-subtle)]";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, "appearance-none bg-[var(--bg-elevated)]", className)} {...props}>
      {children}
    </select>
  );
}
