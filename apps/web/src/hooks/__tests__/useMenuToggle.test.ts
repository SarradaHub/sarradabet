import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenuToggle } from "../useMenuToggle";

describe("useMenuToggle", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("starts closed and toggles open state", () => {
    const { result } = renderHook(() => useMenuToggle());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("locks body scroll while open", () => {
    const { result } = renderHook(() => useMenuToggle());

    act(() => {
      result.current.open();
    });
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      result.current.close();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("reads prefers-reduced-motion preference", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    const { result } = renderHook(() => useMenuToggle());
    expect(result.current.prefersReducedMotion).toBe(true);
  });
});
