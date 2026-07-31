import { ensureTestDatabase } from "./testDatabase";

async function main(): Promise<void> {
  const ready = await ensureTestDatabase();

  if (!ready) {
    console.error(
      "Test database is not ready. Start Postgres with `docker compose up -d db` and retry.",
    );
    process.exit(1);
  }

  console.log("Test database setup complete.");
}

void main();
