import React, { useEffect, useState } from "react";
import type { AdjustCoinsRequest, UserPublic } from "@sarradabet/types";
import { Input, Select } from "@sarradahub/design-system";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { adminUserService } from "../../services/AdminUserService";
import { getApiErrorMessage } from "../../utils/apiError";

interface AdjustCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPublic | null;
  onCoinsAdjusted: () => void;
}

type Direction = AdjustCoinsRequest["direction"];

const emptyForm = {
  direction: "credit" as Direction,
  amount: "",
  reason: "",
};

const AdjustCoinsModal: React.FC<AdjustCoinsModalProps> = ({
  isOpen,
  onClose,
  user,
  onCoinsAdjusted,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDebit, setConfirmDebit] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData(emptyForm);
      setValidationErrors([]);
      setSubmitError(null);
      setConfirmDebit(false);
    }
  }, [isOpen, user]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const amount = Number.parseInt(formData.amount, 10);
    const reason = formData.reason.trim();

    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      errors.push("Informe um valor positivo");
    }
    if (reason.length < 3) {
      errors.push("Motivo deve ter pelo menos 3 caracteres");
    }
    if (
      formData.direction === "debit" &&
      user &&
      !Number.isNaN(amount) &&
      amount > user.coinBalance
    ) {
      errors.push("Valor excede o saldo disponível");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !validateForm()) {
      return;
    }

    if (formData.direction === "debit" && !confirmDebit) {
      setConfirmDebit(true);
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await adminUserService.adjustCoins(user.id, {
        amount: Number.parseInt(formData.amount, 10),
        direction: formData.direction,
        reason: formData.reason.trim(),
      });
      onCoinsAdjusted();
      onClose();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível ajustar as moedas."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const directionLabel =
    formData.direction === "credit" ? "Creditar" : "Debitar";
  const directionColor =
    formData.direction === "credit"
      ? "text-emerald-400"
      : "text-red-400";

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar moedas"
      description={user.username}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-sportsbook-muted">
          Saldo atual:{" "}
          <span className="font-semibold text-sportsbook-fg">
            {user.coinBalance} moedas
          </span>
        </p>

        <Select
          id="adjust-coins-direction"
          label="Operação"
          value={formData.direction}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            setConfirmDebit(false);
            setFormData((current) => ({
              ...current,
              direction: event.target.value as Direction,
            }));
          }}
          options={[
            { value: "credit", label: "Creditar" },
            { value: "debit", label: "Debitar" },
          ]}
          className={sportsbookFieldClass}
        />

        <Input
          id="adjust-coins-amount"
          type="number"
          label="Quantidade"
          min={1}
          value={formData.amount}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
          className={sportsbookFieldClass}
        />

        <div>
          <label
            htmlFor="adjust-coins-reason"
            className="block text-sm font-medium text-sportsbook-fg mb-1.5"
          >
            Motivo
          </label>
          <textarea
            id="adjust-coins-reason"
            value={formData.reason}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
            placeholder="Motivo do ajuste"
            rows={3}
            className={`${sportsbookFieldClass} w-full rounded-lg px-3 py-2 text-sm resize-y`}
          />
        </div>

        {confirmDebit && formData.direction === "debit" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Confirmar débito de {formData.amount} moedas de {user.username}?
          </div>
        )}

        {validationErrors.length > 0 && (
          <ErrorMessage error={validationErrors} title="Erros de validação" />
        )}
        {submitError && <ErrorMessage error={submitError} title="Erro" />}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            variant={formData.direction === "debit" ? "danger" : "primary"}
          >
            {confirmDebit && formData.direction === "debit"
              ? "Confirmar débito"
              : `${directionLabel} moedas`}
          </Button>
        </div>

        <p className={`text-xs ${directionColor}`}>
          {formData.direction === "credit"
            ? "Crédito adiciona moedas ao saldo do usuário."
            : "Débito remove moedas do saldo do usuário."}
        </p>
      </form>
    </SportsbookModal>
  );
};

export default AdjustCoinsModal;
