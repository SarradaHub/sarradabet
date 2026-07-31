import { Link } from "react-router";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/useAuth";

export default function CoinsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-sportsbook-bg text-white">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Moedas</h1>
          <Link to="/" className="text-primary hover:underline text-sm">
            Voltar
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-muted text-sm">Saldo disponível</p>
          <p className="font-display text-4xl font-bold mt-2">
            {user?.coinBalance ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
