import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import CoinsPage from "../CoinsPage";
import { DISCLAIMERS } from "../../constants/disclaimers";

const STATIC_PIX_KEY = "33a26506-c657-44ca-a331-ae7dcb256201";
const COMPROVANTE_MESSAGE =
  "Envie o comprovante para o seguinte número (61) 999272342";

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

const mockStartPurchase = vi.fn();
const mockResetPurchase = vi.fn();

vi.mock("../../hooks/usePixPurchase", () => ({
  usePixPurchase: () => ({
    purchase: {
      paymentId: 1,
      copyPaste: STATIC_PIX_KEY,
      instructionMessage: COMPROVANTE_MESSAGE,
    },
    status: {
      id: 1,
      status: "PENDING",
      copyPaste: STATIC_PIX_KEY,
      instructionMessage: COMPROVANTE_MESSAGE,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
    loading: false,
    error: null,
    startPurchase: mockStartPurchase,
    resetPurchase: mockResetPurchase,
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

  it("does not render instore tab or mock simulate button", async () => {
    renderCoinsPage();

    await screen.findByRole("button", { name: "Comprar com Pix" });

    expect(
      screen.queryByRole("button", { name: "QR presencial" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Simular pagamento aprovado" }),
    ).not.toBeInTheDocument();
  });

  it("shows comprovante message before QR and static pix key", async () => {
    renderCoinsPage();

    expect(await screen.findByText(COMPROVANTE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByAltText("QR Code Pix")).toHaveAttribute(
      "src",
      "/pix-static-qr.png",
    );
    expect(screen.getByDisplayValue(STATIC_PIX_KEY)).toBeInTheDocument();
  });
});
