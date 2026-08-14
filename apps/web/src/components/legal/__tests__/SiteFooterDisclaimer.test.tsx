import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SiteFooterDisclaimer } from "../SiteFooterDisclaimer";

describe("SiteFooterDisclaimer", () => {
  it("renders compact disclaimer inside a footer element", () => {
    render(<SiteFooterDisclaimer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    expect(footer).toContainElement(screen.getByRole("note"));
    expect(screen.getByText(/Não haverá reembolso/)).toBeInTheDocument();
    expect(screen.getByText(/No refunds will be provided/)).toBeInTheDocument();
  });
});
