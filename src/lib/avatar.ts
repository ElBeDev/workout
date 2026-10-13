/**
 * Foto de perfil (docs/gamificacion.md §5). Vive en `user_avatars` y se sirve
 * en `/api/avatar/<id>`; la versión en la URL es `users.avatar_updated_at`,
 * así la caché del navegador puede ser larga y aun así cambiar al subir otra.
 */

/** Lado del cuadrado que manda el teléfono. */
export const AVATAR_SIZE = 256;

/** Tope por si alguien manda la imagen sin pasar por el recorte del cliente. */
export const AVATAR_MAX_BYTES = 200 * 1024;

export function avatarUrl(userId: string, updatedAt: Date | null | undefined): string | null {
  return updatedAt ? `/api/avatar/${userId}?v=${updatedAt.getTime()}` : null;
}

/** El tipo real por los primeros bytes; el `type` que manda el navegador no basta. */
export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
