import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Input } from "@sarradahub/design-system";
import BrandLogo from "../components/BrandLogo";
import { SocialLoginButtons } from "../components/auth/SocialLoginButtons";
import { Button } from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError(
        "Não foi possível entrar com esta conta. Tente novamente ou use email e senha.",
      );
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.username, formData.password);
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const registerTo = searchParams.toString()
    ? `/register?${searchParams.toString()}`
    : "/register";

  return (
    <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md sb-surface border sb-border rounded-2xl p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="md" />
          <h1 className="font-display text-2xl font-bold text-white">
            Entrar
          </h1>
          <p className="text-sportsbook-muted text-sm text-center">
            Acesse sua conta para comprar moedas e participar das apostas.
          </p>
        </div>

        {error && <ErrorMessage error={error} />}

        <SocialLoginButtons />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuário ou e-mail"
            value={formData.username}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            required
            className={sportsbookFieldClass}
          />
          <PasswordInput
            id="login-password"
            name="password"
            label="Senha"
            value={formData.password}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            required
            className={sportsbookFieldClass}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-sportsbook-muted">
          Não tem conta?{" "}
          <Link to={registerTo} className="text-yellow-400 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
