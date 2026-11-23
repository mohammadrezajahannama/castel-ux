import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatNumber, humanizeDuration } from "@/lib/utils";

/*
 * How a table writes the values most columns hold, so every list reads them the same way:
 * - nothing: `<Dash />`
 * - a moment: `<DateCell>`
 * - an amount of money: `<MoneyCell>`
 * - a count or any other number: `formatNumber(n)`; the table lines its digits up on its own, and a column of them
 *   takes `meta: { align: "end" }`
 * - a state or a kind: `<StatusBadge>` / `<TypeBadge>`, from `@/components`
 */

/** A cell with nothing to show. */
export const Dash = () => <span className="text-muted-foreground">—</span>;

interface DateCellProps {
  value?: string | null;
  /** `false`: the day only, for what happens on a day rather than at a moment. */
  time?: boolean;
}

/** A moment: the date and time, with how long ago (or until) on hover. "—" when there's none. */
export function DateCell({ value, time = true }: DateCellProps) {
  if (!value) return <Dash />;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="whitespace-nowrap" />}>{formatDate(value, time)}</TooltipTrigger>
      <TooltipContent>{humanizeDuration(value)}</TooltipContent>
    </Tooltip>
  );
}

interface MoneyCellProps {
  value?: number | null;
  /** Its code, after the amount: "USD", "EUR". */
  currency: string;
  decimals?: number;
}

/**
 * An amount, then its currency's code, muted: "1,250.50 USD". Whole amounts drop the cents ("1,000 USD"); the rest keep
 * all `decimals`, so "129.50" lines up under "4.99". "—" when there's none.
 */
export function MoneyCell({ value, currency, decimals = 2 }: MoneyCellProps) {
  if (value == null) return <Dash />;

  return (
    <span className="whitespace-nowrap">
      {formatNumber(value, decimals, false, !Number.isInteger(value))}{" "}
      <span className="text-xs text-muted-foreground">{currency}</span>
    </span>
  );
}
