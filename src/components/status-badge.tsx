import { m } from "@/paraglide/messages.js";
import { Circle, LucideIcon, PackageCheck, PackageMinus, PackageX } from "lucide-react";
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
  in_stock: { variant: "success", icon: PackageCheck, label: m.status_in_stock },
  low_stock: { variant: "warning", icon: PackageMinus, label: m.status_low_stock },
  out_of_stock: { variant: "destructive", icon: PackageX, label: m.status_out_of_stock },
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
