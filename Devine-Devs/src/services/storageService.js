import { supabase } from '../../supabase';

const BUCKET = 'profile-images';

function extensionFromUri(uri) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

/**
 * Upload a local image URI to Supabase Storage and return the public URL.
 * Requires a public `profile-images` bucket in Supabase.
 */
export async function uploadProfileImage({ userId, localUri, folder = 'avatars' }) {
  const ext = extensionFromUri(localUri);
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: blob.type || `image/${ext}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export { BUCKET as PROFILE_IMAGES_BUCKET };
