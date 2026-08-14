import { OAuthStateStore } from "../services/OAuthStateStore";
import { buildStoredOAuthState } from "../oauth/oauthState";

describe("OAuthStateStore", () => {
  let store: OAuthStateStore;

  beforeEach(() => {
    store = new OAuthStateStore();
    store.clearMemoryStore();
  });

  it("stores OAuth state server-side and returns an opaque session id", async () => {
    const sessionId = await store.save(
      buildStoredOAuthState({
        state: "provider-state",
        provider: "google",
        codeVerifier: "pkce-verifier",
      }),
    );

    expect(sessionId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(sessionId).not.toContain("pkce-verifier");
  });

  it("consumes stored OAuth state once", async () => {
    const sessionId = await store.save(
      buildStoredOAuthState({
        state: "provider-state",
        provider: "google",
        codeVerifier: "pkce-verifier",
      }),
    );

    const stored = await store.consume(sessionId);
    expect(stored.state).toBe("provider-state");
    expect(stored.codeVerifier).toBe("pkce-verifier");

    await expect(store.consume(sessionId)).rejects.toThrow("Invalid OAuth state");
  });

  it("rejects unknown session ids", async () => {
    await expect(store.consume("missing-session")).rejects.toThrow(
      "Invalid OAuth state",
    );
  });
});
