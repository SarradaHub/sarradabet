import React from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../../context/themeUtils";
import { ThemeProvider } from "../../context/ThemeProvider";
import ThemeToggle from "../ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("is keyboard accessible and toggles theme on click", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: /alternar tema|modo/i });

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => {
      button.click();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(button).toHaveAttribute("aria-pressed", "true");

    act(() => {
      button.click();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => {
      button.click();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
  });
});
