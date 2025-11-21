import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";

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
  const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost";
  const IDENTITY_SERVICE_URL = import.meta.env.VITE_IDENTITY_SERVICE_URL || `${API_GATEWAY_URL}/api/v1/auth`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = `${IDENTITY_SERVICE_URL}/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.username, // Support both email and username
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
        !!obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, key);

      let payload: any = raw;
      if (hasOwn(raw, "data")) {
        const first = (raw as any).data;
        if (first.token) {
          localStorage.setItem("authToken", first.token);
          if (first.refreshToken) {
            localStorage.setItem("refreshToken", first.refreshToken);
          }
        }
        payload = hasOwn(first, "data") ? (first as any).data : first;
      }

      const tokenValue =
        (payload && typeof payload === "object" && (payload as any).token && (payload as any).token.token)
          ? (payload as any).token.token
          : (payload as any)?.token;
      if (typeof tokenValue !== "string") {
        throw new Error("Token inválido na resposta da API");
      }

      localStorage.setItem("adminToken", tokenValue);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Acesse o painel administrativo do SarradaBet
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Usuário ou Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                placeholder="Digite seu usuário ou email"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                placeholder="Digite sua senha"
                disabled={loading}
              />
            </div>
          </div>

          {error && <ErrorMessage error={error} title="Erro no Login" />}

          <div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 py-3 text-lg font-semibold"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Voltar para o site
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Credenciais de Teste:
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              <strong>Usuário:</strong> admin
            </div>
            <div>
              <strong>Senha:</strong> admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
