import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserPublic } from "@sarradabet/types";
import AdjustCoinsModal from "../AdjustCoinsModal";

vi.mock("../../services/AdminUserService", () => ({
  adminUserService: {
    adjustCoins: vi.fn(),
  },
}));

const mockUser: UserPublic = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  phone: "5511999999999",
  role: "USER",
  coinBalance: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("AdjustCoinsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    user: mockUser,
    onCoinsAdjusted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows current balance", () => {
    render(<AdjustCoinsModal {...defaultProps} />);

    expect(screen.getByText(/100 moedas/)).toBeInTheDocument();
  });

  it("shows validation errors for invalid amount and reason", () => {
    render(<AdjustCoinsModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Quantidade/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: "ab" },
    });

    const form = screen
      .getByRole("button", { name: /Creditar moedas/i })
      .closest("form");
    fireEvent.submit(form!);

    expect(screen.getByText("Informe um valor positivo")).toBeInTheDocument();
    expect(
      screen.getByText("Motivo deve ter pelo menos 3 caracteres"),
    ).toBeInTheDocument();
  });

  it("requires debit confirmation before submit", () => {
    render(<AdjustCoinsModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Operação/i), {
      target: { value: "debit" },
    });
    fireEvent.change(screen.getByLabelText(/Quantidade/i), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: "Ajuste manual" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Debitar moedas/i }));

    expect(
      screen.getByText(/Confirmar débito de 10 moedas/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar débito/i })).toBeInTheDocument();
  });
});
