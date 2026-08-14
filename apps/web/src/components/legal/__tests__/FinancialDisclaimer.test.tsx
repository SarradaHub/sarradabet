import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FinancialDisclaimer } from "../FinancialDisclaimer";
import { DISCLAIMERS } from "../../../constants/disclaimers";

describe("FinancialDisclaimer", () => {
  it("renders PT disclaimer strings in banner variant", () => {
    render(<FinancialDisclaimer />);

    expect(screen.getByText(DISCLAIMERS.pt.heading)).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMERS.pt.noRefunds)).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMERS.pt.nonConvertible)).toBeInTheDocument();
    expect(screen.getByText(/Não haverá reembolso/)).toBeInTheDocument();
    expect(screen.getByText(/não podem ser convertidas/)).toBeInTheDocument();
  });

  it("renders EN disclaimer strings in a lang=en subsection", () => {
    render(<FinancialDisclaimer />);

    expect(screen.getByText(DISCLAIMERS.en.noRefunds)).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMERS.en.nonConvertible)).toBeInTheDocument();

    const enBlock = screen.getByText(DISCLAIMERS.en.noRefunds).closest('[lang="en"]');
    expect(enBlock).toBeInTheDocument();
  });

  it("uses role=note and aria-labelledby heading", () => {
    render(<FinancialDisclaimer />);

    const note = screen.getByRole("note");
    expect(note).toHaveAttribute("aria-labelledby", "disclaimer-heading");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute(
      "id",
      "disclaimer-heading",
    );
  });

  it("renders compact variant with PT and EN copy", () => {
    render(<FinancialDisclaimer variant="compact" />);

    expect(screen.getByText(/Não haverá reembolso/)).toBeInTheDocument();
    expect(screen.getByText(/não podem ser convertidas/)).toBeInTheDocument();
    expect(screen.getByText(/No refunds will be provided/)).toBeInTheDocument();
  });
});
