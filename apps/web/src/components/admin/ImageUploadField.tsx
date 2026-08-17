import React, { useId, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { sportsbookFieldClass } from "../ui/SportsbookModal";
import { uploadRewardImage } from "../../services/uploadService";
import { getApiErrorMessage } from "../../utils/apiError";
import { getSafeImageUrl } from "../../utils/safeImageUrl";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

export function ImageUploadField({
  value,
  onChange,
  disabled = false,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const previewUrl = getSafeImageUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled || uploading) {
      return;
    }

    if (!isAcceptedImage(file)) {
      setError("Formato não suportado. Use JPG, PNG ou WebP.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      if (compressed.size > 2 * 1024 * 1024) {
        setError("Imagem muito grande. Máximo 2 MB.");
        return;
      }

      const url = await uploadRewardImage(compressed);
      onChange(url);
      setShowManualUrl(false);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Falha no envio. Tente novamente."));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || uploading) {
      return;
    }

    void handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        aria-disabled={disabled || uploading}
        aria-labelledby={`${inputId}-label`}
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!disabled && !uploading) {
            inputRef.current?.click();
          }
        }}
        className={`rounded-xl border border-dashed sb-border bg-sportsbook-raised/40 p-4 text-center transition-colors ${
          disabled || uploading
            ? "cursor-not-allowed opacity-70"
            : "cursor-pointer hover:border-sportsbook-accent/60"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Pré-visualização da recompensa"
            className="mx-auto mb-3 max-h-40 rounded-lg object-contain"
          />
        ) : null}

        <p id={`${inputId}-label`} className="text-sm text-sportsbook-muted">
          {uploading
            ? "Enviando imagem..."
            : "Arraste uma imagem ou clique para selecionar"}
        </p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        className="text-xs text-sportsbook-muted underline underline-offset-2 hover:text-sportsbook-fg"
        onClick={() => setShowManualUrl((current) => !current)}
        disabled={disabled || uploading}
      >
        {showManualUrl ? "Ocultar URL manual" : "Usar URL manual"}
      </button>

      {showManualUrl && (
        <input
          className={sportsbookFieldClass}
          placeholder="URL da imagem (opcional)"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || uploading}
        />
      )}
    </div>
  );
}

export default ImageUploadField;
