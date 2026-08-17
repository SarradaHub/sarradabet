import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "../buildBreadcrumbs";

describe("buildBreadcrumbs", () => {
  it('builds trail for "/admin/bets"', () => {
    const items = buildBreadcrumbs("/admin/bets");

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ label: "Início", href: "/" });
    expect(items[1]).toEqual({ label: "Admin", href: "/admin/dashboard" });
    expect(items[2]).toEqual({ label: "Apostas" });
    expect(items[2].href).toBeUndefined();
  });

  it('builds trail for "/coins"', () => {
    const items = buildBreadcrumbs("/coins");

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ label: "Início", href: "/" });
    expect(items[1]).toEqual({ label: "Moedas" });
    expect(items[1].href).toBeUndefined();
  });

  it('builds trail for "/tickets/verify/ABC"', () => {
    const items = buildBreadcrumbs("/tickets/verify/ABC");

    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ label: "Início", href: "/" });
    expect(items[1]).toEqual({ label: "Ingressos", href: "/tickets" });
    expect(items[2]).toEqual({ label: "Verificar", href: "/tickets/verify" });
    expect(items[3]).toEqual({ label: "ABC" });
    expect(items[3].href).toBeUndefined();
  });

  it('returns single "Início" for root path', () => {
    const items = buildBreadcrumbs("/");

    expect(items).toEqual([{ label: "Início" }]);
  });
});
