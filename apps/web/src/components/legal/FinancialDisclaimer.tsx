import { DISCLAIMERS } from "../../constants/disclaimers";
import { cn } from "../../utils/cn";

type FinancialDisclaimerProps = {
  variant?: "banner" | "compact";
};

export function FinancialDisclaimer({
  variant = "banner",
}: FinancialDisclaimerProps) {
  const { pt, en } = DISCLAIMERS;
  const isBanner = variant === "banner";

  return (
    <aside
      role="note"
      aria-labelledby="disclaimer-heading"
      className={cn(
        isBanner
          ? "rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 space-y-3"
          : "text-sm text-sportsbook-muted space-y-1",
      )}
    >
      <h2
        id="disclaimer-heading"
        className={cn(
          "font-display font-semibold",
          isBanner
            ? "text-base text-amber-900 dark:text-amber-100"
            : "text-xs uppercase tracking-wide text-sportsbook-fg",
        )}
      >
        {pt.heading}
      </h2>

      {isBanner ? (
        <>
          <p lang="pt" className="text-sm leading-relaxed">
            {pt.noRefunds}
          </p>
          <p lang="pt" className="text-sm leading-relaxed">
            {pt.nonConvertible}
          </p>
          <div lang="en" className="text-sm text-sportsbook-muted space-y-1 pt-1 border-t border-amber-500/20">
            <p>{en.noRefunds}</p>
            <p>{en.nonConvertible}</p>
          </div>
        </>
      ) : (
        <>
          <p lang="pt" className="text-sm leading-relaxed">
            {pt.noRefunds} {pt.nonConvertible}
          </p>
          <div lang="en" className="text-xs opacity-80">
            <p>{en.noRefunds} {en.nonConvertible}</p>
          </div>
        </>
      )}
    </aside>
  );
}
