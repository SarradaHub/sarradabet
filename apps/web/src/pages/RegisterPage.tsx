import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Input } from "@sarradahub/design-system";
import BrandLogo from "../components/BrandLogo";
import { Button } from "../components/ui/Button";
import PasswordInput from "../components/ui/PasswordInput";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import { useAuth } from "../hooks/useAuth";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(formData);
      const redirect = searchParams.get("redirect") || "/coins";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const loginTo = searchParams.toString()
    ? `/login?${searchParams.toString()}`
    : "/login";

  return (
    <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md sb-surface border sb-border rounded-2xl p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="md" />
          <h1 className="font-display text-2xl font-bold text-sportsbook-fg">
            Criar conta
          </h1>
          <p className="text-sportsbook-muted text-sm text-center">
            Cadastre-se para comprar moedas e participar das apostas.
          </p>
        </div>

        {error && <ErrorMessage error={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuário"
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
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            required
            className={sportsbookFieldClass}
          />
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            required
            className={sportsbookFieldClass}
          />
          <PasswordInput
            id="register-password"
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
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-sportsbook-muted">
          Já tem conta?{" "}
          <Link to={loginTo} className="text-yellow-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
