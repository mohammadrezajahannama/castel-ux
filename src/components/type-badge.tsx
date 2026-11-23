import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { convertCase } from "@/lib/utils";

interface TypeBadgeProps<Type extends string> {
  type: Type;
  /** Each type's icon, kept beside its type (e.g. `CATEGORY_ICONS`). */
  icons: Partial<Record<Type, LucideIcon>>;
  /** What it reads, when not the type in title case (e.g. a translation). */
  label?: React.ReactNode;
}

/**
 * A kind of thing (a category, a role …) as a badge: grey, since a kind is neither good nor bad (colour is for statuses,
 * see StatusBadge), with its icon so a column of them scans at a glance.
 */
export function TypeBadge<Type extends string>({ type, icons, label }: TypeBadgeProps<Type>) {
  const Icon: LucideIcon | undefined = icons[type];

  return (
    <Badge variant="secondary">
      {Icon && <Icon />}
      {label ?? convertCase(type, "title")}
    </Badge>
  );
}
