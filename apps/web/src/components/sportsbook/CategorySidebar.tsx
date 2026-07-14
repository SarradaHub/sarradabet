import { Category } from "../../types/category";

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  categoryCounts: Map<number | "all" | "uncategorized", number>;
  loading?: boolean;
}

const CategorySidebar = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  loading,
}: CategorySidebarProps) => {
  const totalCount = categoryCounts.get("all") ?? 0;

  const items: Array<{
    id: number | null;
    label: string;
    count: number;
  }> = [
    { id: null, label: "Todas", count: totalCount },
    ...categories.map((category) => ({
      id: category.id,
      label: category.title,
      count: categoryCounts.get(category.id) ?? 0,
    })),
  ];

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-10 rounded bg-sportsbook-raised animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <nav className="py-3" aria-label="Categorias">
      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-sportsbook-muted font-display">
        Mercados
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = selectedCategory === item.id;
          return (
            <li key={item.id ?? "all"}>
              <button
                type="button"
                onClick={() => onSelectCategory(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                  isActive
                    ? "sb-nav-active text-warning-400 font-semibold"
                    : "text-zinc-300 hover:bg-sportsbook-raised hover:text-white border-l-[3px] border-transparent"
                }`}
                aria-pressed={isActive}
              >
                <span className="truncate font-display tracking-wide">
                  {item.label}
                </span>
                <span
                  className={`ml-2 shrink-0 text-xs tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-warning-400/20 text-warning-400"
                      : "bg-sportsbook-raised text-sportsbook-muted"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategorySidebar;
