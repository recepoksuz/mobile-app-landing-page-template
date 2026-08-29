import QRCode from "qrcode";

type QrCodeProps = {
  value: string;
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Generates the QR as SVG on the server — not a single byte of library reaches the client.
 * Giving a desktop visitor a store link is a dead click; this is shown instead.
 */
export async function QrCode({ value, size = 200, className = "", title = "QR code" }: QrCodeProps) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <div
      className={`inline-block rounded-2xl bg-white p-3 ${className}`}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
