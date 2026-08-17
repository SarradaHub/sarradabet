import { Link } from "react-router";
import Navigation from "../components/Navigation";
import { AppFooter } from "../components/legal/AppFooter";
import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-sportsbook-bg text-sportsbook-fg flex flex-col">
      <Navigation />
      <div className="max-w-xl mx-auto px-4 py-16 space-y-6 flex-1 w-full text-center">
        <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
        <p className="text-sportsbook-muted">
          A página que você procura não existe.
        </p>
        <Link to="/">
          <Button variant="secondary">Voltar ao início</Button>
        </Link>
      </div>
      <AppFooter />
    </div>
  );
}
