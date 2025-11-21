import React from "react";
import { cn } from "../../utils/cn";
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
    <div
      className={cn(
        "bg-red-900/20 border border-red-500/30 rounded-lg p-4",
        className,
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-400">{title}</h3>
          <div className="mt-2 text-sm text-red-300">
            {errors.length === 1 ? (
              <p>{errors[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
          {import.meta.env.DEV && apiError?.url && (
            <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-red-400/70">
              <p><strong>Endpoint:</strong> {apiError.method} {apiError.url}</p>
              {apiError.requestId && (
                <p><strong>Request ID:</strong> {apiError.requestId}</p>
              )}
            </div>
          )}
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
export { ErrorMessage };
