// The BioLoop mark, as a base64 data URI for printed documents.
//
// expo-print renders self-contained HTML: a bundled asset reference or a
// file path does not resolve inside the PDF, so the bytes have to be inline.
// Resolving at runtime rather than committing a base64 blob keeps ~200KB of
// encoded PNG out of the JS bundle.
//
// Everything here is best-effort. If the asset, the native module, or the
// read fails, the caller gets null and the document renders without a logo
// rather than failing to render at all — a certificate missing its mark is
// a far better outcome than a certificate that will not open.

let cached;

export async function getLogoDataUri() {
  if (cached !== undefined) return cached;
  try {
    const { Asset } = require('expo-asset');
    const FileSystem = require('expo-file-system');

    const asset = Asset.fromModule(require('../../assets/BioLoop_Logo.png'));
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      cached = null;
      return cached;
    }

    let base64 = null;
    if (typeof FileSystem.readAsStringAsync === 'function') {
      const encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
      base64 = await FileSystem.readAsStringAsync(uri, { encoding });
    } else if (typeof FileSystem.File === 'function') {
      // SDK 54+ rewrote the module around File/Directory classes.
      base64 = new FileSystem.File(uri).base64();
    }

    cached = base64 ? `data:image/png;base64,${base64}` : null;
  } catch {
    cached = null;
  }
  return cached;
}
