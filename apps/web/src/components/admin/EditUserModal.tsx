import React, { useEffect, useState } from "react";
import type { UpdateUserDto, UserPublic, UserRole } from "@sarradabet/types";
import { Input, Select } from "@sarradahub/design-system";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { userService } from "../../services/UserService";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatPhoneFromApi, formatPhoneMask } from "../../utils/phoneMask";

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-sportsbook-muted -mt-2">{children}</p>
  );
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPublic | null;
  currentUserId?: number;
  onUserUpdated: () => void;
}

const emptyForm: UpdateUserDto & { password: string } = {
  username: "",
  email: "",
  phone: "",
  role: "USER",
  password: "",
};

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUserId,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username,
        email: user.email,
        phone: formatPhoneFromApi(user.phone),
        role: user.role,
        password: "",
      });
      setValidationErrors([]);
      setSubmitError(null);
    }
  }, [isOpen, user]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const username = formData.username?.trim() ?? "";
    const email = formData.email?.trim() ?? "";
    const phone = formData.phone?.trim() ?? "";

    if (username.length < 3) {
      errors.push("Usuário deve ter pelo menos 3 caracteres");
    }
    if (!email.includes("@")) {
      errors.push("E-mail inválido");
    }
    if (!phone) {
      errors.push("Telefone é obrigatório");
    }
    if (formData.password && formData.password.length < 6) {
      errors.push("Senha deve ter pelo menos 6 caracteres");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !validateForm()) {
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const payload: UpdateUserDto = {
        username: formData.username?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (user.id !== currentUserId && formData.role) {
        payload.role = formData.role;
      }

      await userService.updateUser(user.id, payload);
      onUserUpdated();
      onClose();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível atualizar o usuário."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const editingSelf = user.id === currentUserId;

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar usuário"
      description={user.username}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-user-username"
          type="text"
          label="Usuário"
          value={formData.username ?? ""}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
          className={sportsbookFieldClass}
          required
        />
        <Input
          id="edit-user-email"
          type="email"
          label="E-mail"
          placeholder="seu@email.com"
          autoComplete="email"
          inputMode="email"
          value={formData.email ?? ""}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          className={sportsbookFieldClass}
          required
        />
        <FieldHint>Use um e-mail válido (ex.: nome@gmail.com)</FieldHint>
        <Input
          id="edit-user-phone"
          type="tel"
          label="Telefone"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={formData.phone ?? ""}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              phone: formatPhoneMask(event.target.value),
            }))
          }
          className={sportsbookFieldClass}
          required
        />
        <FieldHint>DDD + número (celular com 9)</FieldHint>
        <Select
          id="edit-user-role"
          label="Função"
          value={formData.role ?? "USER"}
          disabled={editingSelf}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            setFormData((current) => ({
              ...current,
              role: event.target.value as UserRole,
            }))
          }
          options={[
            { value: "USER", label: "Usuário" },
            { value: "ADMIN", label: "Administrador" },
          ]}
          className={sportsbookFieldClass}
        />
        {editingSelf && (
          <p className="text-xs text-sportsbook-muted">
            Você não pode alterar sua própria função.
          </p>
        )}
        <Input
          id="edit-user-password"
          type="password"
          label="Nova senha (opcional)"
          value={formData.password}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          className={sportsbookFieldClass}
          autoComplete="new-password"
        />

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

export default EditUserModal;
