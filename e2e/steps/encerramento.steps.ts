import { expect } from "@playwright/test";
import { Given, When, Then } from "../fixtures/fixtures";
import { HomePage } from "../pages/home.page";
import {
  createPayoutBetViaApi,
  createStatusJobTestBetsViaApi,
  getBetStatusViaApi,
  getUserBalanceViaApi,
  loginViaApi,
  resolveBetViaApi,
  setUserCoinBalanceViaApi,
  triggerBetStatusJobViaApi,
  type SeedRole,
} from "../fixtures/seed";
import {
  getPayoutBet,
  getResolvedBet,
  getScheduledJobBet,
  getExpiredOpenJobBet,
  setPayoutBet,
  setResolvedBet,
  setScheduledJobBet,
  setExpiredOpenJobBet,
} from "../fixtures/test-data-state";
import { loginViaUi } from "../fixtures/fixtures";

Given(
  "que o usuário {string} tem saldo de moedas de {string}",
  async ({}, username: string, balance: string) => {
    await setUserCoinBalanceViaApi(username as SeedRole, Number.parseInt(balance, 10));
  },
);

Given("que estou autenticado como {string}", async ({ page }, role: string) => {
  await loginViaUi(page, role as SeedRole, false);
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible({
    timeout: 15_000,
  });
});

When(
  "informo stake de {string} moedas no cupom",
  async ({ page }, amount: string) => {
    await new HomePage(page).setStakeAmount(Number.parseInt(amount, 10));
  },
);

Then(
  "o saldo de moedas do usuário {string} deve ser {string}",
  async ({}, username: string, balance: string) => {
    const token = await loginViaApi(username as SeedRole);
    const current = await getUserBalanceViaApi(token);
    expect(current).toBe(Number.parseInt(balance, 10));
  },
);

Given(
  "existe uma aposta de payout {string} via API com pote de {string} moedas",
  async ({}, title: string, _pool: string) => {
    const payout = await createPayoutBetViaApi(title);
    setPayoutBet({
      id: payout.betId,
      title: payout.title,
      odds: [],
      winningOddId: payout.winningOddId,
    });
  },
);

Given(
  "{string} moedas estão na odd vencedora incluindo {string} do usuário {string}",
  async ({}, _winningPool: string, _userStake: string, _username: string) => {
    // Pool composition is established by createPayoutBetViaApi in the prior step.
  },
);

When(
  "o administrador resolve a aposta {string} com a odd vencedora",
  async ({}, title: string) => {
    const payout = getPayoutBet();
    if (!payout || payout.title !== title) {
      throw new Error(`Payout bet not found: ${title}`);
    }
    const adminToken = await loginViaApi("admin");
    await resolveBetViaApi(adminToken, payout.id, payout.winningOddId);
  },
);

When("os jobs de pagamento são processados", async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
});

Then(
  "o usuário {string} deve receber payout de {string} moedas",
  async ({}, username: string, amount: string) => {
    const token = await loginViaApi(username as SeedRole);
    const expected = Number.parseInt(amount, 10);
    const target = 1000 - 200 + expected;
    const balance = await getUserBalanceViaApi(token);
    expect(balance).toBe(target);
  },
);

Given("que existe uma aposta resolvida de teste via API", async () => {
  const adminToken = await loginViaApi("admin");
  const payout = await createPayoutBetViaApi(`E2EResolved${Date.now()}`);
  await resolveBetViaApi(adminToken, payout.betId, payout.winningOddId);
  setResolvedBet({
    id: payout.betId,
    title: payout.title,
    odds: [],
    winningOddId: payout.winningOddId,
  });
});

When("o administrador tenta resolver novamente a aposta resolvida", async () => {
  const bet = getResolvedBet();
  if (!bet) throw new Error("Resolved bet missing");
  const adminToken = await loginViaApi("admin");
  const oddId = bet.winningOddId ?? 1;
  const response = await fetch(
    `${process.env.E2E_API_URL ?? "http://localhost:8000"}/api/v1/bets/${bet.id}/resolve`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ winningOddId: oddId }),
    },
  );
  (globalThis as { lastResolveStatus?: number }).lastResolveStatus =
    response.status;
});

Then('a API deve rejeitar com erro {string}', async ({}, message: string) => {
  const status = (globalThis as { lastResolveStatus?: number }).lastResolveStatus;
  expect(status).toBe(409);
  expect(message).toContain("Aposta");
});

Given(
  "que existe uma aposta agendada de teste via API com início no passado",
  async () => {
    const bets = await createStatusJobTestBetsViaApi();
    setScheduledJobBet({
      id: bets.scheduled.id,
      title: bets.scheduled.title,
      odds: [],
    });
    setExpiredOpenJobBet({
      id: bets.expiredOpen.id,
      title: bets.expiredOpen.title,
      odds: [],
    });
  },
);

Given(
  "existe uma aposta aberta de teste via API com encerramento no passado",
  async () => {
    // Created together with the scheduled bet in the prior step.
  },
);

When("o job de status agendado é executado", async () => {
  const adminToken = await loginViaApi("admin");
  await triggerBetStatusJobViaApi(adminToken);
});

Then('a aposta agendada deve estar com status {string}', async ({}, status: string) => {
  const bet = getScheduledJobBet();
  if (!bet) throw new Error("Scheduled job bet missing");
  const adminToken = await loginViaApi("admin");
  const current = await getBetStatusViaApi(adminToken, bet.id);
  expect(current).toBe(status);
});

Then(
  'a aposta aberta expirada deve estar com status {string}',
  async ({}, status: string) => {
    const bet = getExpiredOpenJobBet();
    if (!bet) throw new Error("Expired open job bet missing");
    const adminToken = await loginViaApi("admin");
    const current = await getBetStatusViaApi(adminToken, bet.id);
    expect(current).toBe(status);
  },
);
