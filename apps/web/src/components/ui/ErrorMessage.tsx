import React from "react";
import { Alert } from "@sarradahub/design-system";
import { Button } from "./Button";
import { ApiError } from "../../core/interfaces/IService";

export interface ErrorMessageProps {
  error: string | string[];
  title?: string;
  onRetry?: () => void;
  className?: string;
  apiError?: ApiError | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = "Algo deu errado",
  onRetry,
  className,
  apiError,
}) => {
  const errors = Array.isArray(error) ? error : [error];

  return (
    <Alert variant="error" title={title} className={className}>
      <div>
        {errors.length === 1 ? (
          <p>{errors[0]}</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        )}
        {import.meta.env.DEV && apiError?.url && (
          <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-70">
            <p><strong>Endpoint:</strong> {apiError.method} {apiError.url}</p>
            {apiError.requestId && (
              <p><strong>Request ID:</strong> {apiError.requestId}</p>
            )}
          </div>
        )}
        {onRetry && (
          <div className="mt-4">
            <Button
              onClick={onRetry}
              variant="danger"
              size="sm"
            >
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};

export default ErrorMessage;
export { ErrorMessage };
