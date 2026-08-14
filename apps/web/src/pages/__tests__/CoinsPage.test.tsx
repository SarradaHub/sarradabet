import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import CoinsPage from "../CoinsPage";
import { DISCLAIMERS } from "../../constants/disclaimers";

vi.mock("../../hooks/useCoinBalance", () => ({
  useCoinBalance: () => ({
    balance: 100,
    loading: false,
    refetch: vi.fn(),
    setBalance: vi.fn(),
  }),
}));

vi.mock("../../hooks/useCoinTransactions", () => ({
  useCoinTransactions: () => ({
    transactions: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../../hooks/usePixPurchase", () => ({
  usePixPurchase: () => ({
    purchase: null,
    status: null,
    loading: false,
    error: null,
    startPurchase: vi.fn(),
    resetPurchase: vi.fn(),
    setStatus: vi.fn(),
  }),
}));

vi.mock("../../hooks/useInstorePurchase", () => ({
  useInstorePurchase: () => ({
    purchase: null,
    status: null,
    loading: false,
    error: null,
    startPurchase: vi.fn(),
    resetPurchase: vi.fn(),
    setStatus: vi.fn(),
  }),
}));

vi.mock("../../core/hooks/useSocket", () => ({
  useSocketEvent: vi.fn(),
}));

vi.mock("../../services/CoinPaymentService", () => ({
  coinService: {
    getPackages: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Pacote Básico",
        amountCents: 1000,
        coinsAmount: 100,
        active: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ]),
  },
  paymentService: {},
}));

vi.mock("../../components/Navigation", () => ({
  default: () => <nav data-testid="navigation" />,
}));

vi.mock("../../components/legal/AppFooter", () => ({
  AppFooter: () => <footer data-testid="app-footer" />,
}));

function renderCoinsPage() {
  return render(
    <MemoryRouter>
      <CoinsPage />
    </MemoryRouter>,
  );
}

describe("CoinsPage disclaimers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders financial disclaimer banner and acknowledge checkbox", async () => {
    renderCoinsPage();

    await waitFor(() => {
      expect(screen.getByText(DISCLAIMERS.pt.heading)).toBeInTheDocument();
    });

    expect(screen.getByText(DISCLAIMERS.pt.acknowledge)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("disables Pix purchase buttons until acknowledge checkbox is checked", async () => {
    renderCoinsPage();

    const purchaseButton = await screen.findByRole("button", {
      name: "Comprar com Pix",
    });

    expect(purchaseButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(purchaseButton).not.toBeDisabled();
  });
});
