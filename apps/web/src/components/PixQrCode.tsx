import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const MOCK_PIX_QR_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

interface PixQrCodeProps {
  qrCodeBase64: string | null;
  copyPaste: string | null;
  isMock?: boolean;
}

function shouldRegenerateQr(
  qrCodeBase64: string | null,
  isMock?: boolean,
): boolean {
  if (!qrCodeBase64) {
    return true;
  }

  return isMock === true || qrCodeBase64 === MOCK_PIX_QR_BASE64;
}

export function PixQrCode({
  qrCodeBase64,
  copyPaste,
  isMock,
}: PixQrCodeProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      if (shouldRegenerateQr(qrCodeBase64, isMock) && copyPaste) {
        const dataUrl = await QRCode.toDataURL(copyPaste, {
          width: 224,
          margin: 1,
        });

        if (!cancelled) {
          setImageSrc(dataUrl);
        }
        return;
      }

      if (qrCodeBase64 && !cancelled) {
        setImageSrc(`data:image/png;base64,${qrCodeBase64}`);
      }
    };

    void renderQr().catch(() => {
      if (!cancelled && copyPaste) {
        void QRCode.toDataURL(copyPaste, { width: 224, margin: 1 })
          .then((dataUrl) => {
            if (!cancelled) {
              setImageSrc(dataUrl);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setImageSrc(null);
            }
          });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [copyPaste, isMock, qrCodeBase64]);

  if (!imageSrc) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <img
        src={imageSrc}
        alt="QR Code Pix"
        className="w-56 h-56 rounded-xl bg-white p-3"
      />
    </div>
  );
}
