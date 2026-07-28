import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "positive" | "negative" | "warning" | "brand";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--surface)] text-[var(--fg-muted)]",
    positive: "bg-[color-mix(in_srgb,var(--positive)_15%,transparent)] text-[var(--positive)]",
    negative: "bg-[color-mix(in_srgb,var(--negative)_15%,transparent)] text-[var(--negative)]",
    warning: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)]",
    brand: "bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[var(--brand-2)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
