import React, { useEffect, useState } from "react";
import type { CoinPackage, UpdateCoinPackageDto } from "@sarradabet/types";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { adminCoinPackageService } from "../../services/CoinPaymentService";
import { getApiErrorMessage } from "../../utils/apiError";

interface EditCoinPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinPackage: CoinPackage | null;
  onPackageUpdated: () => void;
}

interface PackageFormState {
  name: string;
  amountReais: string;
  coinsAmount: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: PackageFormState = {
  name: "",
  amountReais: "",
  coinsAmount: "",
  sortOrder: "0",
  isActive: true,
};

const EditCoinPackageModal: React.FC<EditCoinPackageModalProps> = ({
  isOpen,
  onClose,
  coinPackage,
  onPackageUpdated,
}) => {
  const [form, setForm] = useState<PackageFormState>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && coinPackage) {
      setForm({
        name: coinPackage.name,
        amountReais: (coinPackage.amountCents / 100).toFixed(2),
        coinsAmount: String(coinPackage.coinsAmount),
        sortOrder: String(coinPackage.sortOrder),
        isActive: coinPackage.isActive,
      });
      setValidationErrors([]);
      setSubmitError(null);
    }
  }, [isOpen, coinPackage]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const name = form.name.trim();
    const amount = Number.parseFloat(form.amountReais);
    const coins = Number.parseInt(form.coinsAmount, 10);
    const sortOrder = Number.parseInt(form.sortOrder, 10);

    if (name.length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }
    if (!Number.isFinite(amount) || amount < 1) {
      errors.push("Preço deve ser de pelo menos R$ 1,00");
    }
    if (!Number.isFinite(coins) || coins < 1) {
      errors.push("Quantidade de moedas deve ser pelo menos 1");
    }
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      errors.push("Ordem deve ser zero ou maior");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!coinPackage || !validateForm()) {
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const payload: UpdateCoinPackageDto = {
        name: form.name.trim(),
        amountCents: Math.round(Number.parseFloat(form.amountReais) * 100),
        coinsAmount: Number.parseInt(form.coinsAmount, 10),
        sortOrder: Number.parseInt(form.sortOrder, 10),
        isActive: form.isActive,
      };

      await adminCoinPackageService.update(coinPackage.id, payload);
      onPackageUpdated();
      onClose();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível atualizar o pacote."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!coinPackage) {
    return null;
  }

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar pacote"
      description={coinPackage.name}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className={`w-full rounded-lg px-3 py-2 ${sportsbookFieldClass}`}
          placeholder="Nome do pacote"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          required
        />
        <input
          className={`w-full rounded-lg px-3 py-2 ${sportsbookFieldClass}`}
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
          className={`w-full rounded-lg px-3 py-2 ${sportsbookFieldClass}`}
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
          className={`w-full rounded-lg px-3 py-2 ${sportsbookFieldClass}`}
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

        {validationErrors.length > 0 && (
          <ErrorMessage error={validationErrors} title="Erros de validação" />
        )}
        {submitError && <ErrorMessage error={submitError} title="Erro" />}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} disabled={saving}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default EditCoinPackageModal;
