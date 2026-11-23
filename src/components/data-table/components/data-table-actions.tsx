import { m } from "@/paraglide/messages.js";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { EllipsisVertical } from "lucide-react";

interface DataTableActionsProps {
  children: React.ReactNode;
  title?: string;
  /** The table's search box: first in the bar, and the one control a phone keeps out of the ⋮ menu. */
  search?: React.ReactNode;
  /** The table's own icon buttons (filter, view, refresh): after the actions, and in one row on a phone. */
  tools?: React.ReactNode;
}

export const DataTableActions = ({ children, title, search, tools }: DataTableActionsProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mb-3 flex items-center gap-2">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}

        <div className="min-w-0 flex-1">{search}</div>

        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={m.table_actions()} />}>
            <EllipsisVertical />
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="flex flex-col gap-4 empty:hidden [&_button]:w-full">{children}</div>
            <div className="flex gap-2 *:flex-1 empty:hidden">{tools}</div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-3">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      {search}

      <div className="flex-1" />

      {children}
      {tools}
    </div>
  );
};
