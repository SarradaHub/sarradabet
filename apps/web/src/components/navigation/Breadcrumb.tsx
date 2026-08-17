import { Link, useLocation } from "react-router";
import { buildBreadcrumbs } from "./buildBreadcrumbs";
import { cn } from "../../utils/cn";

function BreadcrumbListItem({
  label,
  href,
  isCurrent,
}: {
  label: string;
  href?: string;
  isCurrent: boolean;
}) {
  return (
    <li className="inline-flex items-center">
      {href && !isCurrent ? (
        <Link
          to={href}
          className="text-sportsbook-muted hover:text-sportsbook-fg transition-colors"
        >
          {label}
        </Link>
      ) : (
        <span
          aria-current={isCurrent ? "page" : undefined}
          className={cn(
            isCurrent && "font-semibold text-sportsbook-fg",
            !isCurrent && "text-sportsbook-muted",
          )}
        >
          {label}
        </span>
      )}
    </li>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="mx-1.5 text-sportsbook-muted">
      ›
    </span>
  );
}

export function Breadcrumb() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return null;
  }

  const items = buildBreadcrumbs(pathname);
  const showEllipsis = items.length > 3;
  const first = items[0];
  const last = items[items.length - 1];
  const middle = showEllipsis ? items.slice(1, -1) : items.slice(1, -1);

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b sb-border sb-surface px-4 py-2"
    >
      <ol className="flex flex-wrap items-center text-sm list-none m-0 p-0">
        {first && (
          <>
            <BreadcrumbListItem
              label={first.label}
              href={first.href}
              isCurrent={items.length === 1}
            />
            {items.length > 1 && <Separator />}
          </>
        )}

        {showEllipsis ? (
          <>
            <li className="inline-flex items-center sm:hidden">
              <span className="text-sportsbook-muted" aria-hidden="true">
                …
              </span>
            </li>
            <li className="hidden sm:contents">
              {middle.map((item, index) => (
                <span key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbListItem
                    label={item.label}
                    href={item.href}
                    isCurrent={false}
                  />
                  <Separator />
                </span>
              ))}
            </li>
            {showEllipsis && (
              <span className="sm:hidden">
                <Separator />
              </span>
            )}
          </>
        ) : (
          middle.map((item, index) => (
            <span key={`${item.label}-${index}`} className="contents">
              <BreadcrumbListItem
                label={item.label}
                href={item.href}
                isCurrent={false}
              />
              <Separator />
            </span>
          ))
        )}

        {last && items.length > 1 && (
          <BreadcrumbListItem label={last.label} isCurrent />
        )}
      </ol>
    </nav>
  );
}
