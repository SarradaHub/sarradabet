import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import {
  estimateTotalReturn,
  type ReturnEstimateLine,
} from "../../utils/parimutuel";

interface BetReturnExplainerProps {
  lines: ReturnEstimateLine[];
}

export function BetReturnExplainer({ lines }: BetReturnExplainerProps) {
  const [open, setOpen] = useState(false);
  const totalStake = lines.reduce((sum, line) => sum + line.stake, 0);
  const estimatedReturn = estimateTotalReturn(lines);

  if (totalStake <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border sb-border sb-surface-raised p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-sportsbook-muted">
            Retorno estimado
          </p>
          <p className="text-sm font-bold text-sportsbook-odds tabular-nums">
            {estimatedReturn} moedas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="p-1.5 rounded text-sportsbook-muted hover:text-sportsbook-fg hover:bg-sportsbook-raised transition-colors"
          aria-expanded={open}
          aria-label="Como o retorno é calculado?"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left text-xs text-sportsbook-muted hover:text-sportsbook-fg transition-colors"
        aria-expanded={open}
      >
        <span>Como o retorno é calculado?</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="region"
          aria-label="Como o retorno é calculado?"
          className="text-xs text-sportsbook-muted space-y-2 leading-relaxed"
        >
          <p>
            Apostas usam pool parimutuel: todas as moedas vão para um pote
            comum.
          </p>
          <p>
            25% do pote é taxa da casa; 75% (pote líquido) vai para os
            vencedores.
          </p>
          <p>
            Retorno estimado = aposta × odd exibida no painel (no momento em
            que você selecionou), arredondado para baixo.
          </p>
          <p>
            As odds são parimutuel e mudam conforme entram apostas; o valor
            final só é definido na resolução.
          </p>
          <p>Se perder, o stake não volta.</p>
        </div>
      )}
    </div>
  );
}

export default BetReturnExplainer;
