import { isAxiosError } from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Erro ao processar solicitação",
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; details?: string; errors?: Array<{ message?: string }> }
      | undefined;

    if (data?.message) {
      return data.message;
    }

    if (data?.details) {
      return data.details;
    }

    if (data?.errors?.[0]?.message) {
      return data.errors[0].message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
