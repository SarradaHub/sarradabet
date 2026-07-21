import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, beforeEach, describe, expect, it } from "vitest";
import ProtectedRoute from "../ProtectedRoute";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../hooks/useAuth";

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function renderProtected(initialPath = "/coins") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/coins"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/admin/login" element={<div>Admin login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while auth status is loading", () => {
    mockUseAuth.mockReturnValue({
      status: "loading",
      isAdmin: false,
    });

    renderProtected();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redirects guests to login", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      isAdmin: false,
    });

    renderProtected();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      isAdmin: false,
    });

    renderProtected();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
