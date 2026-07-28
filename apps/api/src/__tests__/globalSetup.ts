import { ensureTestDatabase } from "./helpers/testDatabase";

export default async function globalSetup(): Promise<void> {
  await ensureTestDatabase();
}
