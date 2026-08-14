import { FinancialDisclaimer } from "./FinancialDisclaimer";

export function SiteFooterDisclaimer() {
  return (
    <footer role="contentinfo" className="w-full">
      <FinancialDisclaimer variant="compact" />
    </footer>
  );
}
