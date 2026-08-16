import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navigation from "../Navigation";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isAdmin: false,
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock("../../hooks/useCoinBalance", () => ({
  useCoinBalance: () => ({
    balance: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
    setBalance: vi.fn(),
  }),
}));

vi.mock("../ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

vi.mock("../BrandLogo", () => ({
  default: () => <a href="/">SarradaBet</a>,
}));

describe("Navigation", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("updates aria-expanded when hamburger opens and Escape closes the drawer", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Toggle navigation", hidden: true }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Toggle navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
