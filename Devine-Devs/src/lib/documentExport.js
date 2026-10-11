// Turns statement/receipt HTML into a PDF on the device and hands it to the
// share sheet, so the person can save it to Files, mail it, or send it on.
//
// Both modules are native, so this only works in a build that includes them:
// Expo Go has expo-print and expo-sharing built in, but a custom dev client
// built before they were added does not — it needs rebuilding. See
// docs/STATEMENTS.md.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

/** Safe, dated filename: bioloop-earnings-statement-2026-10-11.pdf */
function buildFileName(kind, suffix) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = String(kind).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const tail = suffix ? `-${String(suffix).toLowerCase().replace(/[^a-z0-9]+/g, '')}` : '';
  return `bioloop-${slug}${tail}-${date}.pdf`;
}

/**
 * Renders HTML to a PDF and opens the share sheet.
 *
 * Returns { uri, fileName, shared }. `shared: false` means the PDF was
 * written but the platform had no share sheet to offer it to — the caller
 * should tell the person where it is rather than claim it was sent.
 */
export async function exportPdf({ html, kind = 'document', suffix = '', dialogTitle }) {
  // printToFileAsync writes to a cache path with a random name; we copy it to
  // a readable filename so what lands in Files/WhatsApp is self-describing.
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const fileName = buildFileName(kind, suffix);
  let finalUri = uri;
  try {
    const target = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: target });
    finalUri = target;
  } catch {
    // Keep the original path rather than failing the whole export over a
    // cosmetic filename.
  }

  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (!canShare) {
    return { uri: finalUri, fileName, shared: false };
  }

  await Sharing.shareAsync(finalUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: dialogTitle ?? 'Save or send this document',
  });

  return { uri: finalUri, fileName, shared: true };
}
