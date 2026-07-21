import React, { useEffect, useState } from "react";
import type { UserPublic } from "@sarradabet/types";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/UserService";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserPublic | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.listUsers();
      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleDelete = async () => {
    if (!confirmUser) {
      return;
    }

    try {
      setDeletingId(confirmUser.id);
      setError(null);
      await userService.deleteUser(confirmUser.id);
      setConfirmUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir usuário");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Usuários</h1>
        <p className="text-sportsbook-muted text-sm">
          Gerencie contas de usuários da plataforma.
        </p>
      </div>

      {error && <ErrorMessage error={error} />}

      {loading ? (
        <LoadingSpinner text="Carregando usuários..." />
      ) : (
        <div className="overflow-x-auto sb-surface border sb-border rounded-2xl">
          <table className="min-w-full text-sm">
            <thead className="border-b sb-border text-sportsbook-muted">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Função</th>
                <th className="px-4 py-3 text-left">Moedas</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b sb-border/60">
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.coinBalance}</td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={
                        user.id === currentUser?.id || deletingId === user.id
                      }
                      onClick={() => setConfirmUser(user)}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        title="Excluir usuário"
      >
        <div className="space-y-4">
          <p className="text-sportsbook-muted">
            Tem certeza que deseja excluir{" "}
            <span className="text-white font-medium">
              {confirmUser?.username}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmUser(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deletingId !== null}
              onClick={() => void handleDelete()}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
