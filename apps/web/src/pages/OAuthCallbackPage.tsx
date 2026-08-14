import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../hooks/useAuth";

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const completeOAuthLogin = async () => {
      try {
        const token = await refreshSession();
        if (cancelled) {
          return;
        }

        if (!token) {
          navigate("/login?error=oauth", { replace: true });
          return;
        }

        const redirect = searchParams.get("redirect") || "/";
        navigate(redirect, { replace: true });
      } catch {
        if (!cancelled) {
          navigate("/login?error=oauth", { replace: true });
        }
      }
    };

    void completeOAuthLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshSession, searchParams]);

  return (
    <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md sb-surface border sb-border rounded-2xl p-6 space-y-4 text-center">
        <BrandLogo size="md" />
        <p className="text-sportsbook-muted text-sm">Finalizando login...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
