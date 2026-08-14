import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../LoginPage";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Google and Facebook social login buttons", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const googleLink = screen.getByRole("link", {
      name: "Continuar com Google",
    });
    const facebookLink = screen.getByRole("link", {
      name: "Continuar com Facebook",
    });

    expect(googleLink).toHaveAttribute(
      "href",
      "/api/v1/auth/oauth/google",
    );
    expect(facebookLink).toHaveAttribute(
      "href",
      "/api/v1/auth/oauth/facebook",
    );
    expect(screen.getByText("ou continue com")).toBeInTheDocument();
  });

  it("shows OAuth error message from query string", () => {
    render(
      <MemoryRouter initialEntries={["/login?error=oauth"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "Não foi possível entrar com esta conta. Tente novamente ou use email e senha.",
      ),
    ).toBeInTheDocument();
  });
});
