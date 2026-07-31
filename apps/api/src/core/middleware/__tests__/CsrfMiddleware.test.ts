import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { csrfProtection, csrfTokenHandler } from "../CsrfMiddleware";

describe("CsrfMiddleware", () => {
  it("passes through unsafe requests in test environment", async () => {
    const app = express();
    app.use(cookieParser());
    app.use(csrfProtection);
    app.post("/protected", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(app).post("/protected").expect(200);
  });

  it("returns a CSRF token from the auth endpoint handler", async () => {
    const app = express();
    app.use(cookieParser());
    app.get("/api/v1/auth/csrf-token", csrfTokenHandler);

    const response = await request(app)
      .get("/api/v1/auth/csrf-token")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.csrfToken).toBe("string");
    expect(response.body.data.csrfToken.length).toBeGreaterThan(0);
  });

  it("rejects unsafe requests without a CSRF token when protection is enabled", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    jest.resetModules();
    const enabledModule = await import("../CsrfMiddleware");
    const app = express();
    app.use(cookieParser());
    app.use(enabledModule.csrfProtection);
    app.get("/api/v1/auth/csrf-token", enabledModule.csrfTokenHandler);
    app.post("/protected", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    try {
      await request(app).post("/protected").expect(403);

      const agent = request.agent(app);
      const csrfResponse = await agent
        .get("/api/v1/auth/csrf-token")
        .expect(200);
      const csrfToken = csrfResponse.body.data.csrfToken as string;

      await agent
        .post("/protected")
        .set("X-CSRF-Token", csrfToken)
        .expect(200);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      jest.resetModules();
    }
  });
});
