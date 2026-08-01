import { execSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

const e2eDatabaseEnv = {
  DATABASE_URL:
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet",
  DIRECT_URL:
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet",
};

export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_SKIP_WEBSERVER === "true") {
    return;
  }

  execSync("npm run prisma:migrate:deploy && npm run db:seed:simple", {
    cwd: path.join(repoRoot, "apps/api"),
    env: { ...process.env, ...e2eDatabaseEnv },
    stdio: "inherit",
  });
}
