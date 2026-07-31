process.env.NODE_ENV = "test";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet_test";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret";
}
