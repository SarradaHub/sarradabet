import { Response } from "express";

type ApiResponseData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

type ApiErrorResponse = {
  path?: string;
  message: string;
  stack?: string;
};

export class ApiResponse {
  constructor(private res: Response) {}

  success(data: ApiResponseData, statusCode: number = 200) {
    // Handle paginated results FIRST, before any other processing
    // This must be checked before envelope normalization to avoid double-wrapping
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      
      // Check for paginated results: { data: [...], meta: {...} }
      // This pattern indicates a paginated response that should be flattened
      if (Object.prototype.hasOwnProperty.call(obj, "data") && 
          Object.prototype.hasOwnProperty.call(obj, "meta") &&
          Array.isArray(obj.data) &&
          !Object.prototype.hasOwnProperty.call(obj, "success")) {
        const { data: paginatedData, meta, message, ...rest } = obj as { 
          data: unknown[]; 
          meta: unknown;
          message?: string;
        } & Record<string, unknown>;
        const body: Record<string, unknown> = { 
          success: true, 
          data: paginatedData,
          meta 
        };
        // Include message if present
        if (message && typeof message === "string") {
          body.message = message;
        }
        // Include any other properties (excluding success and message which we handle above)
        Object.keys(rest).forEach(key => {
          if (key !== "success") {
            body[key] = rest[key];
          }
        });
        this.res.status(statusCode).json(body);
        return;
      }
    }

    // Normalize already-shaped responses safely and only when it truly looks like our API envelope
    if (data && typeof data === "object") {
      const maybeEnvelope = data as Record<string, unknown>;
      const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(maybeEnvelope, key);
      const hasSuccessKey = hasOwn("success") && typeof maybeEnvelope.success === "boolean";
      const hasEnvelopeHints =
        hasOwn("data") ||
        (hasOwn("message") && typeof (maybeEnvelope as { message?: unknown }).message === "string") ||
        (hasOwn("errors") && Array.isArray((maybeEnvelope as { errors?: unknown }).errors));

      if (hasSuccessKey && hasEnvelopeHints) {
        const shaped = maybeEnvelope as {
          success: boolean;
          message?: string;
          errors?: ApiErrorResponse[];
          data?: ApiResponseData;
        } & Record<string, unknown>;

        // For success=false payloads coming into success(), convert to a proper error response
        if (shaped.success === false) {
          const message = typeof shaped.message === "string" ? shaped.message : "Request failed";
          const errors = Array.isArray(shaped.errors) ? shaped.errors : undefined;
          this.error(message, errors, statusCode);
          return;
        }

        // For success=true payloads, re-wrap consistently as { success: true, data, message? }
        const hasDataKey = Object.prototype.hasOwnProperty.call(shaped, "data");
        const topLevelMessage =
          typeof shaped.message === "string" ? (shaped.message as string) : undefined;
        const normalizedData = hasDataKey
          ? ((shaped.data ?? null) as ApiResponseData)
          : (() => {
              // Keep all fields except the envelope discriminator 'success'
              const { success, ...rest } = shaped as Record<string, unknown>;
              return Object.keys(rest).length ? (rest as unknown as ApiResponseData) : null;
            })();

        const body: Record<string, unknown> = { success: true, data: normalizedData };
        if (topLevelMessage) body.message = topLevelMessage;
        this.res.status(statusCode).json(body);
        return;
      }
    }

    // If caller provided an object with a top-level message (but no explicit envelope),
    // hoist it to the top-level response and keep the remainder as data.
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const hasSuccessKey = Object.prototype.hasOwnProperty.call(obj, "success");
      const hasMessage = typeof obj.message === "string";
      
      if (hasMessage && !hasSuccessKey) {
        const { message, ...rest } = obj as { message: string } & Record<string, unknown>;
        const restIsEmpty = Object.keys(rest).length === 0;
        this.res.status(statusCode).json({
          success: true,
          data: restIsEmpty ? null : (rest as unknown as ApiResponseData),
          message,
        });
        return;
      }
    }

    this.res.status(statusCode).json({ success: true, data });
  }

  error(
    message: string,
    errors?: ApiErrorResponse[],
    statusCode: number = 400,
  ) {
    this.res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  status(statusCode: number) {
    this.res.status(statusCode);
    return this;
  }
}
