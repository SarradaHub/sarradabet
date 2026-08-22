import { isAxiosError } from "axios";

export const GENERIC_API_ERROR_MESSAGE =
  "Ocorreu um erro genérico. Tente novamente.";

const GENERIC_API_MESSAGES = new Set([
  "validation failed",
  "falha na validação",
  "internal server error",
  "something went wrong",
  "an error occurred",
  "request failed",
  "an unexpected error occurred",
  "invalid data provided",
]);

const EN_TO_PT: Record<string, string> = {
  "Username already exists": "Este usuário já está cadastrado.",
  "Email already exists": "Este e-mail já está cadastrado.",
  "Phone already exists": "Este telefone já está cadastrado.",
  "Invalid credentials": "Usuário ou senha inválidos.",
  "Invalid refresh token": "Sessão expirada. Faça login novamente.",
  "Refresh token reuse detected": "Sessão inválida. Faça login novamente.",
  "Refresh token expired": "Sessão expirada. Faça login novamente.",
  "Too many login attempts, please try again later":
    "Muitas tentativas de login. Tente mais tarde.",
  "Too many registration attempts, please try again later":
    "Muitas tentativas de cadastro. Tente mais tarde.",
  "Too many requests from this IP, please try again later":
    "Muitas requisições. Tente mais tarde.",
  "Invalid CSRF token": "Token de segurança inválido. Recarregue a página.",
  "Validation failed": "Falha na validação.",
  "Invalid email format": "Formato de e-mail inválido.",
  "Invalid Brazilian phone number": "Telefone brasileiro inválido.",
  "A record with this data already exists":
    "Já existe um registro com estes dados.",
  "Record not found": "Registro não encontrado.",
  "Invalid reference to related record": "Referência inválida a outro registro.",
  "Invalid data for relation": "Dados inválidos para a relação.",
  "Database operation failed": "Falha na operação do banco de dados.",
  "Internal server error": GENERIC_API_ERROR_MESSAGE,
  "Something went wrong": GENERIC_API_ERROR_MESSAGE,
  "An error occurred": GENERIC_API_ERROR_MESSAGE,
  "Unauthorized access": "Acesso não autorizado.",
  "Forbidden access": "Acesso negado.",
  "Insufficient permissions": "Permissões insuficientes.",
  "Invalid or expired token": "Token inválido ou expirado.",
  "Usuário ou senha inválidos.": "Usuário ou senha inválidos.",
  "Este usuário já está cadastrado.": "Este usuário já está cadastrado.",
  "Este e-mail já está cadastrado.": "Este e-mail já está cadastrado.",
  "Este telefone já está cadastrado.": "Este telefone já está cadastrado.",
  "Falha na validação": "Falha na validação",
  "Muitas tentativas de login. Tente mais tarde.":
    "Muitas tentativas de login. Tente mais tarde.",
  "Muitas tentativas de cadastro. Tente mais tarde.":
    "Muitas tentativas de cadastro. Tente mais tarde.",
  "Muitas requisições. Tente mais tarde.":
    "Muitas requisições. Tente mais tarde.",
  "Ocorreu um erro genérico. Tente novamente.": GENERIC_API_ERROR_MESSAGE,
  "No file uploaded": "Nenhum arquivo enviado.",
  "Unsupported image type": "Tipo de imagem não suportado.",
  "File too large": "Arquivo muito grande.",
};

function isGenericMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (GENERIC_API_MESSAGES.has(normalized)) {
    return true;
  }
  if (/^request failed with status code \d+$/i.test(message.trim())) {
    return true;
  }
  return false;
}

function translateKnownMessage(message: string): string {
  const trimmed = message.trim();
  if (EN_TO_PT[trimmed]) {
    return EN_TO_PT[trimmed];
  }
  return trimmed;
}

type ApiErrorPayload = {
  message?: string;
  details?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

function extractFromPayload(
  data: ApiErrorPayload | undefined,
  status?: number,
): string | null {
  if (!data) {
    return null;
  }

  const fieldMessage = data.errors?.find((e) => e.message?.trim())?.message;
  const topMessage = data.message?.trim();
  const details = data.details?.trim();

  if (fieldMessage && (!topMessage || isGenericMessage(topMessage))) {
    return translateKnownMessage(fieldMessage);
  }

  if (topMessage && !isGenericMessage(topMessage)) {
    return translateKnownMessage(topMessage);
  }

  if (fieldMessage) {
    return translateKnownMessage(fieldMessage);
  }

  if (details && !isGenericMessage(details)) {
    return translateKnownMessage(details);
  }

  if (topMessage) {
    return translateKnownMessage(topMessage);
  }

  if (status && status >= 500) {
    return GENERIC_API_ERROR_MESSAGE;
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Erro ao processar solicitação",
): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorPayload | undefined;
    const fromPayload = extractFromPayload(data, status);

    if (fromPayload) {
      return fromPayload;
    }

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "Tempo esgotado. Tente novamente.";
      }
      if (error.message === "Network Error") {
        return "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      return GENERIC_API_ERROR_MESSAGE;
    }

    if (status && status >= 500) {
      return GENERIC_API_ERROR_MESSAGE;
    }

    if (error.message && !isGenericMessage(error.message)) {
      return translateKnownMessage(error.message);
    }

    return fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const msg = (error as { message: string }).message;
    if (msg && !isGenericMessage(msg)) {
      return translateKnownMessage(msg);
    }
  }

  if (error instanceof Error && error.message && !isGenericMessage(error.message)) {
    return translateKnownMessage(error.message);
  }

  return fallback;
}

/** Normalize Axios error so err.message is user-facing PT text. */
export function normalizeAxiosErrorMessage(
  error: AxiosError,
  fallback = GENERIC_API_ERROR_MESSAGE,
): AxiosError {
  const userMessage = getApiErrorMessage(error, fallback);
  error.message = userMessage;
  (error as AxiosError & { userMessage?: string }).userMessage = userMessage;
  return error;
}
