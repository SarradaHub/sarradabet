import { describe, expect, it } from "vitest";
import {
  formatPhoneFromApi,
  formatPhoneMask,
  stripPhoneDigits,
} from "../phoneMask";

describe("phoneMask", () => {
  it("formats mobile number while typing", () => {
    expect(formatPhoneMask("1")).toBe("(1");
    expect(formatPhoneMask("11")).toBe("(11");
    expect(formatPhoneMask("119")).toBe("(11) 9");
    expect(formatPhoneMask("11999991234")).toBe("(11) 99999-1234");
  });

  it("formats landline (10 digits)", () => {
    expect(formatPhoneMask("1133334444")).toBe("(11) 3333-4444");
  });

  it("strips country code when pasting 55 prefix", () => {
    expect(formatPhoneMask("5511999991234")).toBe("(11) 99999-1234");
    expect(stripPhoneDigits("5511999991234")).toBe("11999991234");
  });

  it("limits to 11 national digits", () => {
    expect(formatPhoneMask("119999912345678")).toBe("(11) 99999-1234");
  });

  it("formats phone from API storage", () => {
    expect(formatPhoneFromApi("5511999991234")).toBe("(11) 99999-1234");
    expect(formatPhoneFromApi("11999991234")).toBe("(11) 99999-1234");
  });

  it("returns empty for empty input", () => {
    expect(formatPhoneMask("")).toBe("");
    expect(stripPhoneDigits("")).toBe("");
  });
});
