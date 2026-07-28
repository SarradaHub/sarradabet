import React, { useEffect, useState } from "react";
import type { Reward, ValidateTicketResponse } from "@sarradabet/types";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import { adminRewardService } from "../services/rewardService";
import { getApiErrorMessage } from "../utils/apiError";
import { TicketValidationModal } from "../components/admin/TicketValidationModal";
import { EditRewardModal } from "../components/admin/EditRewardModal";

const emptyForm = {
  title: "",
  description: "",
  coinCost: "1000",
  stock: "10",
  imageUrl: "",
  isActive: true,
};

const AdminRewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [validateResult, setValidateResult] =
    useState<ValidateTicketResponse | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  function formatDate(value: string): string {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const loadRewards = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminRewardService.listAll();
      setRewards(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRewards();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await adminRewardService.create({
        title: form.title,
        description: form.description || undefined,
        coinCost: Number.parseInt(form.coinCost, 10),
        stock: Number.parseInt(form.stock, 10),
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive,
      });
      setForm(emptyForm);
      await loadRewards();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (reward: Reward) => {
    try {
      if (reward.isActive) {
        await adminRewardService.deactivate(reward.id);
      } else {
        await adminRewardService.update(reward.id, { isActive: true });
      }
      await loadRewards();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleValidateTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidating(true);
    setValidateResult(null);
    setValidateError(null);

    try {
      const result = await adminRewardService.validateTicket(ticketCode.trim());
      setValidateResult(result);
      setShowValidationModal(true);
      setTicketCode("");
    } catch (err) {
      setValidateError(getApiErrorMessage(err));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Recompensas
        </h1>
        <p className="text-sportsbook-muted text-sm mt-1">
          Gerencie o catálogo e valide tickets de resgate
        </p>
      </div>

      {error && <ErrorMessage error={error} />}

      <form
        onSubmit={handleCreate}
        className="sb-surface border sb-border rounded-2xl p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-semibold">Nova recompensa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={sportsbookFieldClass}
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className={sportsbookFieldClass}
            placeholder="Custo em moedas"
            type="number"
            min={1}
            value={form.coinCost}
            onChange={(e) => setForm({ ...form, coinCost: e.target.value })}
            required
          />
          <input
            className={sportsbookFieldClass}
            placeholder="Estoque"
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
          <input
            className={sportsbookFieldClass}
            placeholder="URL da imagem (opcional)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <textarea
            className={`${sportsbookFieldClass} md:col-span-2 min-h-24`}
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Criar recompensa"}
        </Button>
      </form>

      <form
        onSubmit={handleValidateTicket}
        className="sb-surface border sb-border rounded-2xl p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-semibold">Validar ticket</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={sportsbookFieldClass}
            placeholder="Código do ticket (UUID)"
            value={ticketCode}
            onChange={(e) => {
              setTicketCode(e.target.value);
              setValidateResult(null);
              setValidateError(null);
            }}
            required
          />
          <Button type="submit" disabled={validating}>
            {validating ? "Validando..." : "Validar"}
          </Button>
        </div>
        {validateResult && (
          <div
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-300">
                  {validateResult.message}
                </p>
                <p className="text-sm text-sportsbook-muted">
                  Entrega registrada. O ticket saiu da fila de pendentes do
                  usuário.
                </p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              {validateResult.rewardTitle && (
                <div>
                  <dt className="text-sportsbook-muted">Recompensa</dt>
                  <dd className="font-medium text-white">
                    {validateResult.rewardTitle}
                  </dd>
                </div>
              )}
              {validateResult.username && (
                <div>
                  <dt className="text-sportsbook-muted">Usuário</dt>
                  <dd className="font-medium text-white">
                    {validateResult.username}
                  </dd>
                </div>
              )}
              {validateResult.redeemedAt && (
                <div>
                  <dt className="text-sportsbook-muted">Resgatado em</dt>
                  <dd className="font-medium text-white">
                    {formatDate(validateResult.redeemedAt)}
                  </dd>
                </div>
              )}
              {validateResult.validatedAt && (
                <div>
                  <dt className="text-sportsbook-muted">Validado em</dt>
                  <dd className="font-medium text-white">
                    {formatDate(validateResult.validatedAt)}
                  </dd>
                </div>
              )}
            </dl>

            {validateResult.redemption?.ticketCode && (
              <div>
                <p className="text-xs text-sportsbook-muted mb-1">Ticket</p>
                <code className="block rounded-lg bg-black/40 px-3 py-2 text-sm break-all">
                  {validateResult.redemption.ticketCode}
                </code>
              </div>
            )}
          </div>
        )}
        {validateError && <ErrorMessage error={validateError} />}
      </form>

      {validateResult && (
        <TicketValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          result={validateResult}
        />
      )}

      <EditRewardModal
        isOpen={editingReward !== null}
        onClose={() => setEditingReward(null)}
        reward={editingReward}
        onRewardUpdated={() => void loadRewards()}
      />

      {loading ? (
        <LoadingSpinner text="Carregando recompensas..." />
      ) : (
        <div className="sb-surface border sb-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sportsbook-raised text-sportsbook-muted">
              <tr>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward.id} className="border-t sb-border">
                  <td className="px-4 py-3">{reward.title}</td>
                  <td className="px-4 py-3 text-right">{reward.coinCost}</td>
                  <td className="px-4 py-3 text-right">{reward.stock}</td>
                  <td className="px-4 py-3">
                    {reward.isActive ? "Ativa" : "Inativa"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingReward(reward)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void toggleActive(reward)}
                      >
                        {reward.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRewardsPage;
