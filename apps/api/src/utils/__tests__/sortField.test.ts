import {
  BET_SORT_FIELDS,
  DEFAULT_SORT_FIELDS,
  resolveSortField,
} from "../sortField";

describe("resolveSortField", () => {
  it("returns fallback for undefined sort field", () => {
    expect(resolveSortField(undefined, BET_SORT_FIELDS, "createdAt")).toBe(
      "createdAt",
    );
  });

  it("returns allowed sort field when valid", () => {
    expect(resolveSortField("closesAt", BET_SORT_FIELDS, "createdAt")).toBe(
      "closesAt",
    );
  });

  it("returns fallback for disallowed sort field", () => {
    expect(resolveSortField("__proto__", BET_SORT_FIELDS, "createdAt")).toBe(
      "createdAt",
    );
    expect(
      resolveSortField("maliciousField", BET_SORT_FIELDS, "createdAt"),
    ).toBe("createdAt");
  });

  it("blocks prototype pollution keys", () => {
    for (const key of ["__proto__", "constructor", "prototype", "toString"]) {
      expect(resolveSortField(key, DEFAULT_SORT_FIELDS, "createdAt")).toBe(
        "createdAt",
      );
    }
  });
});
