import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import BrandLogo from "../components/BrandLogo";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { Input } from "@sarradahub/design-system";

interface LoginForm {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = API_BASE_URL
        ? `${API_BASE_URL}/api/v1/admin/login`
        : "/api/v1/admin/login";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const raw = await response.json();

      if (!response.ok) {
        const message =
          (raw && typeof raw === "object" && (raw.message as string)) ||
          "Erro ao fazer login";
        throw new Error(message);
      }

      const hasOwn = (obj: unknown, key: string) =>
        !!obj &&
        typeof obj === "object" &&
        Object.prototype.hasOwnProperty.call(obj, key);

      let payload: any = raw;
      if (hasOwn(raw, "data")) {
        const first = (raw as any).data;
        payload = hasOwn(first, "data") ? (first as any).data : first;
      }

      const tokenValue =
        payload &&
        typeof payload === "object" &&
        (payload as any).token &&
        (payload as any).token.token
          ? (payload as any).token.token
          : (payload as any)?.token;
      if (typeof tokenValue !== "string") {
        throw new Error("Token inválido na resposta da API");
      }

      localStorage.setItem("adminToken", tokenValue);
      localStorage.setItem("authToken", tokenValue);
      localStorage.setItem(
        "adminInfo",
        JSON.stringify({
          id: payload.id,
          username: payload.username,
          email: payload.email,
        }),
      );

      navigate("/admin/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <BrandLogo size="lg" showText={false} />
          <h2 className="mt-4 text-center font-display text-3xl font-bold text-white tracking-wide">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-sportsbook-muted">
            Painel administrativo SarradaBet
          </p>
        </div>

        <form
          className="mt-8 space-y-6 sb-surface border sb-border rounded-xl p-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              label="Usuário ou Email"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Digite seu usuário ou email"
              disabled={loading}
              aria-describedby={error ? "username-error" : undefined}
              className="dark:bg-sportsbook-raised dark:border-sportsbook-border dark:text-white dark:placeholder-sportsbook-muted dark:focus:ring-warning-400"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Senha"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Digite sua senha"
              disabled={loading}
              aria-describedby={error ? "password-error" : undefined}
              className="dark:bg-sportsbook-raised dark:border-sportsbook-border dark:text-white dark:placeholder-sportsbook-muted dark:focus:ring-warning-400"
            />
          </div>

          {error && (
            <div id="login-error" role="alert">
              <ErrorMessage error={error} title="Erro no Login" />
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full sb-brand-gradient text-black hover:from-warning-300 hover:to-orange-400 py-3 text-lg font-semibold font-display tracking-wide"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sportsbook-muted hover:text-white transition-colors text-sm"
            >
              ← Voltar para o site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
