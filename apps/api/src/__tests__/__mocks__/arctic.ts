export class Google {
  createAuthorizationURL(state: string, codeVerifier: string, scopes: string[]) {
    return new URL(
      `https://accounts.google.com/o/oauth2/v2/auth?state=${state}&verifier=${codeVerifier}&scopes=${scopes.join(",")}`,
    );
  }

  async validateAuthorizationCode() {
    return {
      idToken: () => "mock-id-token",
    };
  }
}

export class Facebook {
  createAuthorizationURL(state: string, scopes: string[]) {
    return new URL(
      `https://www.facebook.com/v18.0/dialog/oauth?state=${state}&scopes=${scopes.join(",")}`,
    );
  }

  async validateAuthorizationCode() {
    return {
      accessToken: () => "mock-access-token",
    };
  }
}

export const generateState = (): string => "test-state";

export const generateCodeVerifier = (): string => "test-verifier";

export const decodeIdToken = (): Record<string, string> => ({
  sub: "google-user-1",
  email: "social@example.com",
  name: "Social User",
});
