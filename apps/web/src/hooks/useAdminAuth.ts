import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export interface AdminInfo {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
}

export function useAdminAuth() {
  const navigate = useNavigate();
  const { user, status, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !isAdmin) {
      navigate("/admin/login");
    }
  }, [status, isAdmin, navigate]);

  const adminInfo: AdminInfo | null =
    user && isAdmin
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      : null;

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return {
    adminInfo,
    loading: status === "loading",
    error:
      status === "authenticated" && !isAdmin
        ? "Acesso restrito a administradores"
        : null,
    handleLogout,
    verifySession: async () => {
      if (status !== "authenticated" || !isAdmin) {
        navigate("/admin/login");
      }
    },
  };
}
