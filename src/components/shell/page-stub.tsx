import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

// Honest placeholder for routes on the roadmap — not a fake dashboard, just a
// signpost so navigation never 404s. Replaced as each module ships.
export function PageStub({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Badge tone="brand">
          <Sparkles className="h-3 w-3" /> On the roadmap
        </Badge>
      </div>
      <Card className="max-w-2xl">
        <p className="text-sm text-[var(--fg-muted)]">Planned for this module:</p>
        <ul className="mt-3 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-2)]" />
              {p}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
