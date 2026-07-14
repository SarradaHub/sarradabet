import React from "react";
import SportsbookModal from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  error?: string | null;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "danger",
  loading = false,
  error = null,
}) => {
  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
    >
      {error && <ErrorMessage error={error} title="Erro" />}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant={variant}
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
          className={
            variant === "primary"
              ? "sb-brand-gradient text-black font-display font-semibold"
              : undefined
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </SportsbookModal>
  );
};

export default ConfirmDialog;
