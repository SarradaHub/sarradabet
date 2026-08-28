import { NavLink, useParams } from "react-router";
import { Category } from "../../types/category";
import { cn } from "../../utils/cn";

interface CategorySidebarProps {
  categories: Category[];
  categoryCounts: Map<number | "all" | "uncategorized", number>;
  loading?: boolean;
  onNavigate?: () => void;
}

const CategorySidebar = ({
  categories,
  categoryCounts,
  loading,
  onNavigate,
}: CategorySidebarProps) => {
  const { id: categoryParam } = useParams();
  const selectedCategoryId =
    categoryParam != null ? Number.parseInt(categoryParam, 10) : null;
  const totalCount = categoryCounts.get("all") ?? 0;

  const items: Array<{
    id: number | null;
    to: string;
    label: string;
    count: number;
  }> = [
    { id: null, to: "/", label: "Todas", count: totalCount },
    ...categories.map((category) => ({
      id: category.id,
      to: `/category/${category.id}`,
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
          const isActive =
            item.id === null
              ? categoryParam == null
              : selectedCategoryId === item.id;

          return (
            <li key={item.id ?? "all"}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors duration-150 border-l-[3px]",
                  isActive
                    ? "sb-nav-active text-amber-900 dark:text-warning-400 font-semibold"
                    : "text-sportsbook-muted hover:bg-sportsbook-raised hover:text-sportsbook-fg border-transparent",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="truncate font-display tracking-wide">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "ml-2 shrink-0 text-xs tabular-nums px-1.5 py-0.5 rounded",
                    isActive
                      ? "bg-amber-200 text-amber-900 dark:bg-warning-400/20 dark:text-warning-400"
                      : "bg-sportsbook-raised text-sportsbook-muted",
                  )}
                >
                  {item.count}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategorySidebar;
