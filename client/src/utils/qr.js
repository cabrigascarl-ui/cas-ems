import QRCode from 'qrcode';

/**
 * Creates a standard identification string for equipment items.
 * Can be scanned by any standard QR reader or our internal scanner.
 */
export function formatQRPayload(item) {
  if (!item) return '';
  const code = item.unitCode || item.id;
  return `CAS-EMS:${item.labId || ''}:${code}`;
}

/**
 * Parses scanned text from a QR code or barcode reader into a unitCode or ID.
 */
export function parseScannedCode(rawText = '') {
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  // Matches CAS-EMS:labId:unitCode
  if (trimmed.startsWith('CAS-EMS:')) {
    const parts = trimmed.split(':');
    return parts[2] || parts[1] || trimmed;
  }

  // If a full URL was encoded, extract the last path segment
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length) return segments[segments.length - 1];
  } catch {
    // Not a URL, proceed
  }

  return trimmed;
}

/**
 * Generates a base64 Data URL for a QR code image.
 */
export async function generateQRDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 256,
      margin: options.margin ?? 1,
      color: {
        dark: options.dark || '#0f172a',
        light: options.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return null;
  }
}
