const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

let cachedCsrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  const response = await fetch(`${API_URL}/api/v1/auth/csrf-token`, {
    credentials: "include",
  });
  const body = (await response.json()) as ApiEnvelope<{ csrfToken: string }>;
  if (!response.ok || !body.success || !body.data?.csrfToken) {
    throw new Error(`CSRF token fetch failed: ${body.message ?? response.status}`);
  }

  cachedCsrfToken = body.data.csrfToken;
  return cachedCsrfToken;
}

function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

function isMutatingMethod(method: string | undefined): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(
    (method ?? "GET").toUpperCase(),
  );
}

export async function assertApiHealthy(): Promise<void> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`);
  }
}

export const SEED_USERS = {
  user: { username: "user", password: "user123", email: "user@sarradabet.com" },
  admin: {
    username: "admin",
    password: "admin123",
    email: "admin@sarradabet.com",
  },
} as const;

export type SeedRole = keyof typeof SEED_USERS;

type AuthPayload = {
  user: { id: number; username: string; email: string; role: string };
  accessToken: string | { token: string };
};

function extractAccessToken(
  accessToken: AuthPayload["accessToken"],
): string {
  if (typeof accessToken === "string") {
    return accessToken;
  }
  return accessToken.token;
}

export type TestUser = {
  id: number;
  username: string;
  email: string;
};

export async function loginViaApi(role: SeedRole): Promise<string> {
  const credentials = SEED_USERS[role];
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });

  const body = (await response.json()) as ApiEnvelope<AuthPayload>;
  if (!response.ok || !body.success || !body.data?.accessToken) {
    throw new Error(
      `API login failed for ${role}: ${body.message ?? response.status}`,
    );
  }

  clearCsrfToken();
  await fetchCsrfToken();
  return extractAccessToken(body.data.accessToken);
}

function uniquePhone(suffix: number = Date.now()): string {
  return `55119${String(suffix).slice(-8)}`;
}

export async function createUserViaApi(data: {
  username: string;
  email: string;
  phone?: string;
  password?: string;
}): Promise<TestUser> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      phone: data.phone ?? uniquePhone(),
      password: data.password ?? "password123",
    }),
  });

  const body = (await response.json()) as ApiEnvelope<AuthPayload>;
  if (!response.ok || !body.success || !body.data?.user) {
    throw new Error(
      `API register failed: ${body.message ?? response.status}`,
    );
  }

  clearCsrfToken();
  return {
    id: body.data.user.id,
    username: body.data.user.username,
    email: body.data.user.email,
  };
}

export async function deleteUserViaApi(
  adminToken: string,
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (!response.ok) {
    const body = (await response.json()) as ApiEnvelope<unknown>;
    throw new Error(
      `API delete user failed: ${body.message ?? response.status}`,
    );
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, method, ...rest } = options;
  const csrfToken = isMutatingMethod(method)
    ? await fetchCsrfToken()
    : undefined;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(headers ?? {}),
    },
  });

  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success) {
    throw new Error(body.message ?? `API request failed: ${response.status}`);
  }

  return body.data as T;
}

export async function createCategoryViaApi(
  adminToken: string,
  title: string,
): Promise<{ id: number; title: string }> {
  const data = await apiRequest<{ category: { id: number; title: string } }>(
    "/api/v1/categories",
    {
      method: "POST",
      token: adminToken,
      body: JSON.stringify({ title }),
    },
  );
  return data.category;
}

export async function updateCategoryViaApi(
  adminToken: string,
  categoryId: number,
  title: string,
): Promise<void> {
  await apiRequest(`/api/v1/categories/${categoryId}`, {
    method: "PUT",
    token: adminToken,
    body: JSON.stringify({ title }),
  });
}

export async function deleteCategoryViaApi(
  adminToken: string,
  categoryId: number,
): Promise<void> {
  await apiRequest(`/api/v1/categories/${categoryId}`, {
    method: "DELETE",
    token: adminToken,
  });
}

export async function createBetViaApi(
  token: string,
  data: {
    title: string;
    description?: string;
    categoryId: number;
    odds: Array<{ title: string }>;
  },
): Promise<{ id: number; title: string; odds: Array<{ id: number; title: string }> }> {
  const response = await apiRequest<{
    bet: { id: number; title: string; odds: Array<{ id: number; title: string }> };
  }>("/api/v1/bets", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
  return response.bet;
}

export async function closeBetViaApi(
  adminToken: string,
  betId: number,
): Promise<void> {
  await apiRequest(`/api/v1/bets/${betId}/close`, {
    method: "PATCH",
    token: adminToken,
  });
}

export async function resolveBetViaApi(
  adminToken: string,
  betId: number,
  winningOddId: number,
): Promise<void> {
  await apiRequest(`/api/v1/bets/${betId}/resolve`, {
    method: "PATCH",
    token: adminToken,
    body: JSON.stringify({ winningOddId }),
  });
}

export async function deleteBetViaApi(
  adminToken: string,
  betId: number,
): Promise<void> {
  await apiRequest(`/api/v1/bets/${betId}`, {
    method: "DELETE",
    token: adminToken,
  });
}

export async function categoryExistsViaSearch(title: string): Promise<boolean> {
  const searchTerm = title.length >= 2 ? title.slice(0, Math.min(title.length, 20)) : title;
  const response = await fetch(
    `${API_URL}/api/v1/categories/search?searchTerm=${encodeURIComponent(searchTerm)}`,
  );
  const body = (await response.json()) as ApiEnvelope<{
    categories: Array<{ id: number; title: string }>;
  }>;

  if (!response.ok || !body.success || !body.data?.categories) {
    return false;
  }

  return body.data.categories.some((category) => category.title === title);
}

export async function getCategoryIdByTitle(title: string): Promise<number> {
  const response = await fetch(
    `${API_URL}/api/v1/categories/search?searchTerm=${encodeURIComponent(title)}`,
  );
  const body = (await response.json()) as ApiEnvelope<{
    categories: Array<{ id: number; title: string }>;
  }>;

  if (!response.ok || !body.success || !body.data?.categories?.length) {
    throw new Error(
      `Category lookup failed for "${title}": ${body.message ?? response.status}`,
    );
  }

  const match = body.data.categories.find((category) => category.title === title);
  if (!match) {
    throw new Error(`Category not found: ${title}`);
  }

  return match.id;
}

export async function listCategoriesViaApi(): Promise<
  Array<{ id: number; title: string }>
> {
  const categoryId = await getCategoryIdByTitle("Futebol");
  return [{ id: categoryId, title: "Futebol" }];
}

export async function setUserCoinBalanceViaApi(
  username: SeedRole,
  balance: number,
): Promise<void> {
  const userId = await getUserIdByUsername(username);
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL ?? process.env.E2E_DATABASE_URL },
    },
  });
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { coinBalance: balance },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function getUserIdByUsername(username: string): Promise<number> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      username,
      password: SEED_USERS[username as SeedRole]?.password ?? "user123",
    }),
  });
  const body = (await response.json()) as ApiEnvelope<AuthPayload>;
  if (!body.success || !body.data?.user?.id) {
    throw new Error(`Could not resolve user id for ${username}`);
  }
  return body.data.user.id;
}

export async function getUserBalanceViaApi(token: string): Promise<number> {
  const data = await apiRequest<{ balance: number }>("/api/v1/coins/balance", {
    token,
  });
  return data.balance;
}

export async function voteViaApi(
  userToken: string,
  data: { oddId: number; amount: number },
): Promise<{ voteId: number }> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_URL}/api/v1/votes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  });
  const body = (await response.json()) as ApiEnvelope<{
    vote: { id: number };
  }>;
  if (!response.ok || !body.success || !body.data?.vote?.id) {
    throw new Error(body.message ?? `Vote failed: ${response.status}`);
  }
  return { voteId: body.data.vote.id };
}

export async function createPayoutBetViaApi(
  title: string,
): Promise<{
  betId: number;
  winningOddId: number;
  title: string;
}> {
  const adminToken = await loginViaApi("admin");
  const userToken = await loginViaApi("user");
  const categoryId = await getCategoryIdByTitle("Futebol");
  const bet = await createBetViaApi(adminToken, {
    title,
    categoryId,
    odds: [{ title: "Vencedor" }, { title: "Perdedor" }],
  });

  const winningOddId = bet.odds[0].id;
  const losingOddId = bet.odds[1].id;

  await voteViaApi(userToken, { oddId: winningOddId, amount: 100 });
  await voteViaApi(adminToken, { oddId: winningOddId, amount: 200 });
  await voteViaApi(userToken, { oddId: losingOddId, amount: 100 });
  await voteViaApi(adminToken, { oddId: losingOddId, amount: 100 });

  const csrfToken = await fetchCsrfToken();
  await fetch(`${API_URL}/api/v1/bets/${bet.id}/close`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "X-CSRF-Token": csrfToken,
    },
  });

  return { betId: bet.id, winningOddId, title };
}

export async function triggerBetStatusJobViaApi(
  adminToken: string,
): Promise<{ opened: number; closed: number }> {
  return apiRequest("/api/v1/jobs/bet-status/run", {
    method: "POST",
    token: adminToken,
  });
}

export async function createStatusJobTestBetsViaApi(): Promise<{
  scheduled: { id: number; title: string };
  expiredOpen: { id: number; title: string };
}> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL ?? process.env.E2E_DATABASE_URL },
    },
  });

  const categoryId = await getCategoryIdByTitle("Futebol");
  const past = new Date(Date.now() - 60_000);
  const future = new Date(Date.now() + 60 * 60_000);
  const suffix = Date.now();

  try {
    const scheduled = await prisma.bet.create({
      data: {
        title: `E2E Scheduled ${suffix}`,
        categoryId,
        status: "scheduled",
        startTime: past,
        closesAt: future,
        odds: {
          create: [
            { title: "A", value: 2 },
            { title: "B", value: 2 },
          ],
        },
      },
    });

    const expiredOpen = await prisma.bet.create({
      data: {
        title: `E2E ExpiredOpen ${suffix}`,
        categoryId,
        status: "open",
        startTime: new Date(Date.now() - 120_000),
        closesAt: past,
        odds: {
          create: [
            { title: "A", value: 2 },
            { title: "B", value: 2 },
          ],
        },
      },
    });

    return {
      scheduled: { id: scheduled.id, title: scheduled.title },
      expiredOpen: { id: expiredOpen.id, title: expiredOpen.title },
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getBetStatusViaApi(
  adminToken: string,
  betId: number,
): Promise<string> {
  const data = await apiRequest<{ bet: { status: string } }>(
    `/api/v1/bets/${betId}`,
    { token: adminToken },
  );
  return data.bet.status;
}

export async function waitForUserBalance(
  userToken: string,
  expectedBalance: number,
  timeoutMs = 10_000,
): Promise<number> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const balance = await getUserBalanceViaApi(userToken);
    if (balance === expectedBalance) {
      return balance;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Balance did not reach ${expectedBalance} in time`);
}
