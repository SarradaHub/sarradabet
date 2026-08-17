import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NotFoundPage from "../NotFoundPage";

vi.mock("../../components/Navigation", () => ({
  default: () => <nav data-testid="navigation" />,
}));

vi.mock("../../components/legal/AppFooter", () => ({
  AppFooter: () => <footer data-testid="app-footer" />,
}));

describe("NotFoundPage", () => {
  it("renders heading and home link", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A página que você procura não existe."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar ao início" }),
    ).toHaveAttribute("href", "/");
  });
});
