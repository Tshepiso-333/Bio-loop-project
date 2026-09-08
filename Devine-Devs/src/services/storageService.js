import { File } from 'expo-file-system';
import { supabase } from '../../supabase';

const BUCKET = 'profile-images';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
};

function extensionFromUri(uri) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

/**
 * Upload a local image URI to Supabase Storage and return the public URL.
 * Requires a public `profile-images` bucket in Supabase.
 *
 * Reads the file via expo-file-system's `File.arrayBuffer()` rather than
 * `fetch(uri).blob().arrayBuffer()` — React Native's Blob polyfill doesn't
 * implement `.arrayBuffer()`, so that call is always undefined on-device.
 */
export async function uploadProfileImage({ userId, localUri, folder = 'avatars' }) {
  const ext = extensionFromUri(localUri);
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: MIME_TYPES[ext] ?? `image/${ext}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export { BUCKET as PROFILE_IMAGES_BUCKET };
