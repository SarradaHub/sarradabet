import React, { useEffect, useState } from "react";
import type { Reward, UpdateRewardDto } from "@sarradabet/types";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { adminRewardService } from "../../services/rewardService";
import { getApiErrorMessage } from "../../utils/apiError";

interface EditRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  onRewardUpdated: () => void;
}

interface RewardFormState {
  title: string;
  description: string;
  coinCost: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: RewardFormState = {
  title: "",
  description: "",
  coinCost: "",
  stock: "",
  imageUrl: "",
  isActive: true,
};

export function EditRewardModal({
  isOpen,
  onClose,
  reward,
  onRewardUpdated,
}: EditRewardModalProps) {
  const [form, setForm] = useState<RewardFormState>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && reward) {
      setForm({
        title: reward.title,
        description: reward.description ?? "",
        coinCost: String(reward.coinCost),
        stock: String(reward.stock),
        imageUrl: reward.imageUrl ?? "",
        isActive: reward.isActive,
      });
      setValidationErrors([]);
      setSubmitError(null);
    }
  }, [isOpen, reward]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const title = form.title.trim();
    const coinCost = Number.parseInt(form.coinCost, 10);
    const stock = Number.parseInt(form.stock, 10);

    if (title.length < 2) {
      errors.push("Título deve ter pelo menos 2 caracteres");
    }
    if (!Number.isFinite(coinCost) || coinCost < 1) {
      errors.push("Custo em moedas deve ser pelo menos 1");
    }
    if (!Number.isFinite(stock) || stock < 0) {
      errors.push("Estoque não pode ser negativo");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reward || !validateForm()) {
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const payload: UpdateRewardDto = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        coinCost: Number.parseInt(form.coinCost, 10),
        stock: Number.parseInt(form.stock, 10),
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      };

      await adminRewardService.update(reward.id, payload);
      onRewardUpdated();
      onClose();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível atualizar a recompensa."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!reward) {
    return null;
  }

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar recompensa"
      description={reward.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationErrors.length > 0 && (
          <ul className="text-sm text-red-400 space-y-1">
            {validationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        {submitError && <ErrorMessage error={submitError} />}

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

        <label className="flex items-center gap-2 text-sm text-sportsbook-muted">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="rounded border-sportsbook-border"
          />
          Recompensa ativa no catálogo
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
}

export default EditRewardModal;
