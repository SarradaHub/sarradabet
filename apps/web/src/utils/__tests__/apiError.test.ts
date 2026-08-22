import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import {
  GENERIC_API_ERROR_MESSAGE,
  getApiErrorMessage,
  normalizeAxiosErrorMessage,
} from "../apiError";

function axiosError(
  status: number,
  data?: Record<string, unknown>,
  message = "Request failed with status code 400",
): AxiosError {
  const error = new AxiosError(message);
  error.response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as AxiosError["response"] extends infer R
      ? R extends { config: infer C }
        ? C
        : never
      : never,
  };
  return error;
}

describe("getApiErrorMessage", () => {
  it("returns field error when top message is generic validation", () => {
    const err = axiosError(400, {
      message: "Validation failed",
      errors: [{ field: "email", message: "Formato de e-mail inválido." }],
    });
    expect(getApiErrorMessage(err)).toBe("Formato de e-mail inválido.");
  });

  it("translates known English auth messages", () => {
    const err = axiosError(400, { message: "Email already exists" });
    expect(getApiErrorMessage(err)).toBe("Este e-mail já está cadastrado.");
  });

  it("returns generic PT for 500", () => {
    const err = axiosError(500, { message: "Internal server error" });
    expect(getApiErrorMessage(err)).toBe(GENERIC_API_ERROR_MESSAGE);
  });

  it("returns connection message for network errors", () => {
    const err = new AxiosError("Network Error");
    expect(getApiErrorMessage(err)).toBe(
      "Erro de conexão. Verifique sua internet e tente novamente.",
    );
  });

  it("uses contextual fallback for generic axios message without body", () => {
    const err = axiosError(400, undefined);
    expect(getApiErrorMessage(err, "Erro ao cadastrar")).toBe("Erro ao cadastrar");
  });

  it("normalizeAxiosErrorMessage overwrites error.message", () => {
    const err = axiosError(400, { message: "Phone already exists" });
    normalizeAxiosErrorMessage(err);
    expect(err.message).toBe("Este telefone já está cadastrado.");
  });
});
