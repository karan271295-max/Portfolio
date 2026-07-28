import { cn } from "@/lib/utils";

export function Card({
  className,
  glass,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-5 transition-colors",
        glass ? "glass" : "bg-[var(--bg-elevated)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]",
        className,
      )}
      {...props}
    />
  );
}
