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

  it("validates callback using server-stored OAuth state", async () => {
    const sessionId = await store.save(
      buildStoredOAuthState({
        state: "provider-state",
        provider: "google",
        codeVerifier: "pkce-verifier",
      }),
    );

    const result = await store.validateCallbackRequest({
      sessionId,
      provider: "google",
      authorizationCode: "auth-code",
      returnedState: "provider-state",
    });

    expect(result.authorizationCode).toBe("auth-code");
    expect(result.storedState.codeVerifier).toBe("pkce-verifier");
  });

  it("rejects callback when returned state does not match server state", async () => {
    const sessionId = await store.save(
      buildStoredOAuthState({
        state: "provider-state",
        provider: "google",
        codeVerifier: "pkce-verifier",
      }),
    );

    await expect(
      store.validateCallbackRequest({
        sessionId,
        provider: "google",
        authorizationCode: "auth-code",
        returnedState: "wrong-state",
      }),
    ).rejects.toThrow("OAuth state mismatch");
  });

  it("rejects malformed session ids before lookup", async () => {
    await expect(
      store.validateCallbackRequest({
        sessionId: "not-a-valid-session-id",
        provider: "google",
        authorizationCode: "auth-code",
        returnedState: "provider-state",
      }),
    ).rejects.toThrow("Invalid OAuth callback session");
  });
});
