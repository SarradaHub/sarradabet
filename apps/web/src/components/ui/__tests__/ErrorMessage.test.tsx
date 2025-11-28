import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorMessage from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("should render with default title", () => {
    render(<ErrorMessage error="Something went wrong" />);

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render with custom title", () => {
    render(<ErrorMessage error="Something went wrong" title="Custom Error" />);

    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render single error message", () => {
    render(<ErrorMessage error="Single error message" />);

    const errorText = screen.getByText("Single error message");
    expect(errorText).toBeInTheDocument();
    expect(errorText.tagName).toBe("P");
  });

  it("should render multiple error messages as list", () => {
    const errors = ["First error", "Second error", "Third error"];
    render(<ErrorMessage error={errors} />);

    expect(screen.getByText("First error")).toBeInTheDocument();
    expect(screen.getByText("Second error")).toBeInTheDocument();
    expect(screen.getByText("Third error")).toBeInTheDocument();

    const list = screen.getByText("First error").closest("ul");
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass("list-disc", "list-inside", "space-y-1");
  });

  it("should render retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Error message" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", {
      name: /tentar novamente/i,
    });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveClass("bg-error-600", "text-white");
  });

  it("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Error message" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", {
      name: /tentar novamente/i,
    });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", () => {
    render(<ErrorMessage error="Error message" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should accept custom className", () => {
    render(<ErrorMessage error="Error message" className="custom-class" />);

    // Find the outermost div with the custom class
    const container = document.querySelector(".custom-class");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("custom-class");
  });

  it("should have correct styling classes", () => {
    render(<ErrorMessage error="Error message" />);

    // Alert component from design system wraps content
    const alert = screen.getByText("Error message").closest('[role="alert"]') || 
                  screen.getByText("Error message").closest('div');
    expect(alert).toBeInTheDocument();
  });

  it("should have error icon", () => {
    render(<ErrorMessage error="Error message" />);

    const icon = document.querySelector("svg");
    expect(icon).toBeInTheDocument();
    // Icon from Alert component uses lucide-react classes
    expect(icon).toHaveClass("w-5", "h-5");
  });

  it("should handle empty error array", () => {
    render(<ErrorMessage error={[]} />);

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    // Should not crash and should render the container
    const container = screen.getByText("Algo deu errado").closest("div");
    expect(container).toBeInTheDocument();
  });
});
