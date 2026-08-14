import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  applyTheme,
  loadPreference,
  resolveTheme,
  savePreference,
} from "../themeUtils";

describe("themeUtils", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  describe("resolveTheme", () => {
    it("returns dark when preference is dark", () => {
      expect(resolveTheme("dark", false)).toBe("dark");
    });

    it("returns light when preference is light", () => {
      expect(resolveTheme("light", true)).toBe("light");
    });

    it("follows system preference when set to system", () => {
      expect(resolveTheme("system", true)).toBe("dark");
      expect(resolveTheme("system", false)).toBe("light");
    });
  });

  describe("applyTheme", () => {
    it("sets the resolved theme class on documentElement", () => {
      applyTheme("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });
  });

  describe("loadPreference", () => {
    it("returns system when nothing is stored", () => {
      expect(loadPreference()).toBe("system");
    });

    it("returns stored preference when valid", () => {
      localStorage.setItem(STORAGE_KEY, "light");
      expect(loadPreference()).toBe("light");

      localStorage.setItem(STORAGE_KEY, "dark");
      expect(loadPreference()).toBe("dark");

      localStorage.setItem(STORAGE_KEY, "system");
      expect(loadPreference()).toBe("system");
    });

    it("falls back to system for invalid values", () => {
      localStorage.setItem(STORAGE_KEY, "invalid");
      expect(loadPreference()).toBe("system");
    });
  });

  describe("savePreference", () => {
    it("persists preference to localStorage", () => {
      savePreference("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });
  });
});
