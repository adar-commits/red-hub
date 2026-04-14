/** Limits for designer project photo uploads (server-enforced); safe to import from client. */
export const PROJECT_PHOTO_MAX_FILE_BYTES = 12 * 1024 * 1024;
export const PROJECT_PHOTO_MAX_PER_PROJECT = 80;
export const PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR = 120;
export const PROJECT_CREATE_MAX_PER_DESIGNER_PER_DAY = 40;

export const PROJECT_PHOTOS_BUCKET = "project-photos";

export function isProbablyImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i.test(file.name.trim());
}
