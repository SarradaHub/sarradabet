import { type ReactNode } from "react";

interface SportsbookLayoutProps {
  header: ReactNode;
  promo?: ReactNode;
  sidebar: ReactNode;
  board: ReactNode;
  slip: ReactNode;
  mobileSlipChip?: ReactNode;
}

const SportsbookLayout = ({
  header,
  promo,
  sidebar,
  board,
  slip,
  mobileSlipChip,
}: SportsbookLayoutProps) => (
  <div className="min-h-screen bg-sportsbook-bg text-white flex flex-col">
    {header}
    {promo}
    <div className="flex flex-1 min-h-0">
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r sb-border sb-surface overflow-y-auto">
        {sidebar}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{board}</div>
      </main>

      <aside className="hidden xl:flex w-[300px] shrink-0 flex-col border-l sb-border sb-surface overflow-y-auto">
        {slip}
      </aside>
    </div>

    <div className="xl:hidden">{mobileSlipChip}</div>
  </div>
);

export default SportsbookLayout;
