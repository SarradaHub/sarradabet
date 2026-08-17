import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "../Breadcrumb";

function renderBreadcrumb(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Breadcrumb />
    </MemoryRouter>,
  );
}

describe("Breadcrumb", () => {
  it("renders nothing on home", () => {
    const { container } = renderBreadcrumb("/");

    expect(container.firstChild).toBeNull();
  });

  it('renders "Início > Admin > Apostas" for /admin/bets', () => {
    renderBreadcrumb("/admin/bets");

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByText("Apostas")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Apostas" })).not.toBeInTheDocument();
  });

  it("renders last crumb without link on /coins", () => {
    renderBreadcrumb("/coins");

    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
    expect(screen.getByText("Moedas")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Moedas" })).not.toBeInTheDocument();
  });
});
