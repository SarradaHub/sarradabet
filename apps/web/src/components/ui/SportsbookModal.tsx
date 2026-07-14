import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface SportsbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const sportsbookFieldClass =
  "bg-sportsbook-raised border-sportsbook-border text-white placeholder:text-sportsbook-muted focus:ring-warning-400/40 focus:border-warning-400/60";

const SportsbookModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "lg",
  closeOnOverlayClick = true,
}: SportsbookModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {closeOnOverlayClick ? (
        <button
          type="button"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-default"
          aria-label="Fechar modal"
          onClick={onClose}
        />
      ) : (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sportsbook-modal-title"
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col sb-surface-raised border sb-border rounded-lg shadow-2xl focus:outline-none`}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b sb-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-1 h-6 sb-brand-gradient rounded-full shrink-0" />
            <div className="min-w-0">
              <h2
                id="sportsbook-modal-title"
                className="font-display text-lg font-bold tracking-wide text-white uppercase truncate"
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs text-sportsbook-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded text-sportsbook-muted hover:text-white hover:bg-sportsbook-raised transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 sb-modal-form">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default SportsbookModal;
