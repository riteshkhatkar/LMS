import QRCode from "qrcode";

export interface GenerateQrOptions {
  width?: number;
  margin?: number;
}

/**
 * Builds the canonical public verification URL for a given certificate ID.
 */
export function getCertificateVerifyUrl(certificateId: string, baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${host.replace(/\/$/, "")}/verify/${encodeURIComponent(certificateId)}`;
}

/**
 * Generates a high-quality base64 Data URL for the certificate verification QR code.
 */
export async function generateQrDataUrl(
  certificateId: string,
  options?: GenerateQrOptions
): Promise<string> {
  const url = getCertificateVerifyUrl(certificateId);
  return QRCode.toDataURL(url, {
    width: options?.width ?? 280,
    margin: options?.margin ?? 1,
    color: {
      dark: "#1A1A2E",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates a PNG Buffer of the verification QR code for PDF embedding.
 */
export async function generateQrBuffer(
  certificateId: string,
  options?: GenerateQrOptions
): Promise<Buffer> {
  const url = getCertificateVerifyUrl(certificateId);
  return QRCode.toBuffer(url, {
    type: "png",
    width: options?.width ?? 320,
    margin: options?.margin ?? 1,
    color: {
      dark: "#1A1A2E",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
