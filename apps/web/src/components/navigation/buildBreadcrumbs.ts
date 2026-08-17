import { ROUTE_LABELS } from "../../routes/routeLabels";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Início" }];
  }

  const items: BreadcrumbItem[] = [{ label: "Início", href: "/" }];
  let path = "";

  for (const segment of segments) {
    path += `/${segment}`;
    const label = ROUTE_LABELS[segment] ?? segment;
    const isLast = path === pathname;

    let href: string | undefined = isLast ? undefined : path;

    if (segment === "admin" && !isLast) {
      href = "/admin/dashboard";
    }

    items.push({ label, href });
  }

  items[items.length - 1].href = undefined;
  return items;
}
