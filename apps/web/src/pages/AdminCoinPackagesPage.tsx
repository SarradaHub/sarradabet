import React, { useEffect, useState } from "react";
import type { CoinPackage } from "@sarradabet/types";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { adminCoinPackageService } from "../services/CoinPaymentService";

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const emptyForm = {
  name: "",
  amountReais: "5.00",
  coinsAmount: "100",
  isActive: true,
  sortOrder: "0",
};

const AdminCoinPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminCoinPackageService.listAll();
      setPackages(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pacotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await adminCoinPackageService.create({
        name: form.name,
        amountCents: Math.round(Number.parseFloat(form.amountReais) * 100),
        coinsAmount: Number.parseInt(form.coinsAmount, 10),
        isActive: form.isActive,
        sortOrder: Number.parseInt(form.sortOrder, 10),
      });
      setForm(emptyForm);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pacote");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coinPackage: CoinPackage) => {
    try {
      if (coinPackage.isActive) {
        await adminCoinPackageService.deactivate(coinPackage.id);
      } else {
        await adminCoinPackageService.update(coinPackage.id, {
          isActive: true,
        });
      }
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar pacote");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Pacotes de moedas
        </h1>
        <p className="text-sportsbook-muted text-sm">
          Defina a conversão entre reais e moedas para compras via Pix.
        </p>
      </div>

      {error && <ErrorMessage error={error} />}

      <form
        onSubmit={handleCreate}
        className="sb-surface border sb-border rounded-2xl p-5 grid gap-4 md:grid-cols-2"
      >
        <input
          className="rounded-lg bg-sportsbook-raised border sb-border px-3 py-2"
          placeholder="Nome do pacote"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          required
        />
        <input
          className="rounded-lg bg-sportsbook-raised border sb-border px-3 py-2"
          placeholder="Preço em reais"
          value={form.amountReais}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              amountReais: event.target.value,
            }))
          }
          required
        />
        <input
          className="rounded-lg bg-sportsbook-raised border sb-border px-3 py-2"
          placeholder="Quantidade de moedas"
          value={form.coinsAmount}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              coinsAmount: event.target.value,
            }))
          }
          required
        />
        <input
          className="rounded-lg bg-sportsbook-raised border sb-border px-3 py-2"
          placeholder="Ordem"
          value={form.sortOrder}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              sortOrder: event.target.value,
            }))
          }
        />
        <label className="flex items-center gap-2 text-sm text-sportsbook-muted">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
          />
          Ativo
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Criar pacote"}
        </Button>
      </form>

      {loading ? (
        <LoadingSpinner text="Carregando pacotes..." />
      ) : (
        <div className="space-y-3">
          {packages.map((coinPackage) => (
            <div
              key={coinPackage.id}
              className="sb-surface border sb-border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  {coinPackage.name}
                </h2>
                <p className="text-sportsbook-muted text-sm">
                  {formatCurrency(coinPackage.amountCents)} →{" "}
                  {coinPackage.coinsAmount} moedas
                </p>
                <p className="text-xs text-sportsbook-muted">
                  Taxa:{" "}
                  {(
                    coinPackage.coinsAmount /
                    (coinPackage.amountCents / 100)
                  ).toFixed(2)}{" "}
                  moedas/R$
                </p>
              </div>
              <Button
                variant={coinPackage.isActive ? "danger" : "secondary"}
                onClick={() => void toggleActive(coinPackage)}
              >
                {coinPackage.isActive ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoinPackagesPage;
