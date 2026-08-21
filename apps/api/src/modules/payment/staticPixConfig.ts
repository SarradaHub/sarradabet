import { config } from "../../config/env";

export function getStaticPixInstructionMessage(): string {
  if (config.STATIC_PIX_COMPROVANTE_MESSAGE.trim()) {
    return config.STATIC_PIX_COMPROVANTE_MESSAGE.trim();
  }

  return `Envie o comprovante para o seguinte número ${config.STATIC_PIX_COMPROVANTE_PHONE}`;
}
