import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface AdminInfo {
  id: number;
  username: string;
  email: string;
}

export function useAdminAuth() {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    const storedAdminInfo = localStorage.getItem("adminInfo");

    if (!token || !storedAdminInfo) {
      navigate("/admin/login");
      return;
    }

    try {
      setAdminInfo(JSON.parse(storedAdminInfo));

      const url = API_BASE_URL
        ? `${API_BASE_URL}/api/v1/admin/profile`
        : "/api/v1/admin/profile";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Token inválido ou expirado");
      }

      const profileData = await response.json();
      setAdminInfo(profileData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  }, [navigate]);

  return { adminInfo, loading, error, handleLogout, verifySession };
}
