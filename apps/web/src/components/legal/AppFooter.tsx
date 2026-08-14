import { SiteFooterDisclaimer } from "./SiteFooterDisclaimer";

export function AppFooter() {
  return (
    <div className="border-t sb-border sb-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <SiteFooterDisclaimer />
      </div>
    </div>
  );
}
