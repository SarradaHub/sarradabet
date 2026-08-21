import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { TicketVerifyResponse } from "@sarradabet/types";
import Navigation from "../components/Navigation";
import { AppFooter } from "../components/legal/AppFooter";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "../components/ui/Button";
import axios from "axios";
import { ticketService } from "../services/ticketService";
import { getApiErrorMessage } from "../utils/apiError";
import {
  DEFAULT_TICKET_WHATSAPP_PHONE,
  extractTicketShortCode,
  TICKET_WHATSAPP_INSTRUCTION_PREFIX,
  toWhatsAppWaMeUrl,
} from "../utils/ticketContact";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TicketVerifyPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<TicketVerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!code) {
        setError("Código do ticket inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ticketService.verify(code);
        setResult(response);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setResult({
            ticketCode: code,
            isValid: false,
            status: "NOT_FOUND",
            message: "Ticket não encontrado",
          });
        } else {
          setError(getApiErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [code]);

  const isValidated = result?.status === "VALIDATED";
  const shortCode =
    result?.shortCode ??
    (result?.ticketCode ? extractTicketShortCode(result.ticketCode) : null);
  const whatsappPhone =
    result?.whatsappPhone ?? DEFAULT_TICKET_WHATSAPP_PHONE;
  const whatsappUrl = toWhatsAppWaMeUrl(whatsappPhone);

  return (
    <div className="min-h-screen bg-sportsbook-bg text-sportsbook-fg flex flex-col">
      <Navigation />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Verificação de ticket</h1>
            <p className="text-sm text-sportsbook-muted mt-1">
              Confira a autenticidade de um ticket SarradaBet
            </p>
          </div>
          <Link to="/">
            <Button variant="secondary">Voltar ao início</Button>
          </Link>
        </div>

        {loading && <LoadingSpinner text="Verificando ticket..." />}
        {error && <ErrorMessage error={error} />}

        {result && (
          <div
            className={`sb-surface border rounded-2xl p-6 space-y-4 ${
              result.status === "NOT_FOUND"
                ? "border-red-500/40"
                : isValidated
                  ? "border-green-500/40"
                  : "border-amber-500/40"
            }`}
          >
            {result.status === "NOT_FOUND" ? (
              <p className="text-red-300">{result.message}</p>
            ) : (
              <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">
                {result.rewardTitle ?? "Ticket SarradaBet"}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  isValidated
                    ? "border border-green-500/40 bg-green-500/10 text-green-300"
                    : "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                {isValidated ? "Validado" : "Resgatado"}
              </span>
            </div>

            <dl className="grid gap-3 text-sm">
              {shortCode && (
                <div className="rounded-xl border sb-border bg-black/20 px-4 py-4 text-center space-y-2">
                  <dt className="text-sportsbook-muted text-xs uppercase tracking-wide">
                    Código do Ticket
                  </dt>
                  <dd className="font-mono text-4xl font-bold tracking-widest text-sportsbook-fg">
                    {shortCode}
                  </dd>
                  <dd className="text-sportsbook-muted text-sm pt-1">
                    {TICKET_WHATSAPP_INSTRUCTION_PREFIX}{" "}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#FFD700] hover:underline"
                    >
                      {whatsappPhone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sportsbook-muted">Ticket (UUID completo)</dt>
                <dd className="font-mono break-all text-xs text-sportsbook-muted">
                  {result.ticketCode}
                </dd>
              </div>
              {result.userEmail && (
                <div>
                  <dt className="text-sportsbook-muted">Usuário</dt>
                  <dd>{result.userEmail}</dd>
                </div>
              )}
              {result.redeemedAt && (
                <div>
                  <dt className="text-sportsbook-muted">Resgatado em</dt>
                  <dd>{formatDate(result.redeemedAt)}</dd>
                </div>
              )}
              {result.validatedAt && (
                <div>
                  <dt className="text-sportsbook-muted">Validado em</dt>
                  <dd>{formatDate(result.validatedAt)}</dd>
                </div>
              )}
            </dl>
              </>
            )}
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default TicketVerifyPage;
