import { Response } from "express";
import { setCacheControl } from "../cacheHeaders";

describe("setCacheControl", () => {
  const createResponse = () => {
    const headers: Record<string, string> = {};
    return {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
      getHeader: (name: string) => headers[name],
    } as unknown as Response;
  };

  it("sets no-store when list is empty", () => {
    const res = createResponse();

    setCacheControl(res, { noStore: true });

    expect(res.getHeader("Cache-Control")).toBe("no-store");
  });

  it("sets public cache for non-empty lists", () => {
    const res = createResponse();

    setCacheControl(res, { maxAge: 300, staleWhileRevalidate: 60 });

    expect(res.getHeader("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=60",
    );
  });
});
