interface PixQrCodeProps {
  imageSrc: string;
  alt?: string;
}

export function PixQrCode({
  imageSrc,
  alt = "QR Code Pix",
}: PixQrCodeProps) {
  return (
    <div className="flex justify-center">
      <img
        src={imageSrc}
        alt={alt}
        className="w-56 h-56 rounded-xl bg-white p-3"
      />
    </div>
  );
}
