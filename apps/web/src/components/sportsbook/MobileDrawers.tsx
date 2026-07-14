import { useState } from "react";
import { Menu, Ticket } from "lucide-react";
import CategorySidebar from "./CategorySidebar";
import VoteSlip from "./VoteSlip";
import { Category } from "../../types/category";
import { useVoteSlip } from "../../context/VoteSlipContext";

interface MobileDrawersProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  categoryCounts: Map<number | "all" | "uncategorized", number>;
  categoriesLoading?: boolean;
}

export function MobileCategoryDrawer({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoriesLoading,
}: MobileDrawersProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm sb-btn-secondary"
        aria-label="Abrir categorias"
      >
        <Menu className="w-4 h-4" />
        <span className="font-display">Categorias</span>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Fechar categorias"
          />
          <div className="relative w-[260px] max-w-[80vw] h-full sb-surface border-r sb-border overflow-y-auto animate-[slip-enter_0.2s_ease-out]">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(id) => {
                onSelectCategory(id);
                setOpen(false);
              }}
              categoryCounts={categoryCounts}
              loading={categoriesLoading}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileVoteSlipChip() {
  const { count } = useVoteSlip();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="xl:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 sb-brand-gradient text-black font-semibold font-display px-4 py-2.5 rounded-full shadow-lg shadow-black/40 transition-transform hover:scale-105"
        aria-label={
          count > 0
            ? `Abrir cupom com ${count} seleções`
            : "Abrir cupom de votos"
        }
      >
        <Ticket className="w-4 h-4" />
        <span>Cupom</span>
        {count > 0 && (
          <span className="bg-black/25 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Fechar cupom"
          />
          <div className="relative sb-surface border-t sb-border rounded-t-2xl overflow-hidden animate-[slip-enter_0.2s_ease-out]">
            <VoteSlip variant="sheet" onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
