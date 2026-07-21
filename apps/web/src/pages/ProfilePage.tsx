import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/UserService";
import type { UserPublic } from "@sarradabet/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await userService.getById(user.id);
        setProfile(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar perfil",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-sportsbook-bg text-white">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Meu perfil</h1>
          <Link to="/">
            <Button variant="secondary">Voltar ao site</Button>
          </Link>
        </div>

        {error && <ErrorMessage error={error} />}

        {loading ? (
          <LoadingSpinner text="Carregando perfil..." />
        ) : profile ? (
          <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-sportsbook-muted">Usuário</p>
                <p className="font-medium">{profile.username}</p>
              </div>
              <div>
                <p className="text-xs text-sportsbook-muted">E-mail</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-sportsbook-muted">Telefone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
              <div>
                <p className="text-xs text-sportsbook-muted">Função</p>
                <p className="font-medium">{profile.role}</p>
              </div>
              <div>
                <p className="text-xs text-sportsbook-muted">Saldo de moedas</p>
                <p className="font-medium">{profile.coinBalance}</p>
              </div>
              <div>
                <p className="text-xs text-sportsbook-muted">Membro desde</p>
                <p className="font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePage;
