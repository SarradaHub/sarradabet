process.env.JWT_SECRET = "test-secret";

import {
  generateAccessToken,
  verifyAccessToken,
} from "../auth";

describe("auth token jti", () => {
  it("includes jti in verified access token payload", () => {
    const { token } = generateAccessToken({
      userId: 1,
      username: "tester",
      email: "tester@example.com",
      role: "USER",
    });

    const payload = verifyAccessToken(token);
    expect(payload.jti).toEqual(expect.any(String));
  });
});
