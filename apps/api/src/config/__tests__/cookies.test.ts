import {
  getAuthCookieOptions,
  getCookieSameSite,
  getCookieSecure,
  getCsrfCookieName,
} from "../cookies";

describe("cookie helpers", () => {
  it("uses lax insecure cookies outside production", () => {
    expect(getCookieSecure()).toBe(false);
    expect(getCookieSameSite()).toBe("lax");
    expect(getCsrfCookieName()).toBe("x-csrf-token");
    expect(getAuthCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });

  it("uses Secure SameSite=None cookies when production config is loaded", async () => {
    jest.resetModules();
    jest.doMock("../env", () => ({
      config: {
        COOKIE_SECURE: undefined,
        NODE_ENV: "production",
      },
    }));

    const cookies = await import("../cookies");

    expect(cookies.getCookieSecure()).toBe(true);
    expect(cookies.getCookieSameSite()).toBe("none");
    expect(cookies.getCsrfCookieName()).toBe("__Host-sarradabet.x-csrf-token");
    expect(cookies.getAuthCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    jest.dontMock("../env");
    jest.resetModules();
  });
});
