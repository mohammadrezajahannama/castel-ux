import { m } from "@/paraglide/messages.js";
import { Ban, Circle, CircleCheck, CircleMinus, CircleSlash, LucideIcon, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { convertCase } from "@/lib/utils";

/**
 * Every status the panel shows, by its word, so a state reads the same on every table. The variant is what it means, as
 * a colour: done or live `success`, waiting on someone `warning`, broken `destructive`, over or switched off `secondary`.
 */
const STATUSES: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "secondary"; icon: LucideIcon; label: () => string }
> = {
  // A run's task result.
  success: { variant: "success", icon: CircleCheck, label: m.results_success },
  wrong: { variant: "destructive", icon: TriangleAlert, label: m.results_wrong },
  none: { variant: "secondary", icon: CircleMinus, label: m.results_none },
  // How a run's task ended.
  completed: { variant: "success", icon: CircleCheck, label: m.outcome_completed },
  cancelled: { variant: "warning", icon: Ban, label: m.outcome_cancelled },
  abandoned: { variant: "secondary", icon: CircleSlash, label: m.outcome_abandoned },
};

/** A status as a badge: coloured by what it means, with its icon so it reads without the colour too. */
export function StatusBadge({ status }: { status: string }) {
  // ponytail: an unknown status still renders, plain and untranslated; add it to STATUSES to colour and name it.
  const known = STATUSES[status];
  const Icon = known?.icon ?? Circle;

  return (
    <Badge variant={known?.variant ?? "secondary"}>
      <Icon />
      {known ? known.label() : convertCase(status, "title")}
    </Badge>
  );
}
