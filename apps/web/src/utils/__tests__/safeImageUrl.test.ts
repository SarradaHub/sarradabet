import { describe, it, expect } from "vitest";
import { getSafeImageUrl } from "../safeImageUrl";

describe("getSafeImageUrl", () => {
  it("accepts http and https URLs", () => {
    expect(getSafeImageUrl("https://example.com/a.webp")).toBe(
      "https://example.com/a.webp",
    );
    expect(getSafeImageUrl("http://example.com/a.png")).toBe(
      "http://example.com/a.png",
    );
  });

  it("rejects javascript and data URLs", () => {
    expect(getSafeImageUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeImageUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects empty and malformed URLs", () => {
    expect(getSafeImageUrl("")).toBeNull();
    expect(getSafeImageUrl("not-a-url")).toBeNull();
  });
});
