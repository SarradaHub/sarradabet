import type { TestUser } from "./seed";

let testUser: TestUser | null = null;

export function setTestUser(user: TestUser): void {
  testUser = user;
}

export function getTestUser(): TestUser | null {
  return testUser;
}

export function clearTestUser(): void {
  testUser = null;
}
