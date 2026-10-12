/** Private Supabase Storage bucket for household pictures. */
export const MEMBER_PHOTO_BUCKET = "member-photos";

/** Longest edge of the JPEG stored for a member. */
export const MEMBER_PHOTO_MAX_EDGE = 1280;

/** Largest file the picker will accept before resizing. */
export const MEMBER_PHOTO_MAX_BYTES = 12 * 1024 * 1024;

/** Largest JPEG uploaded after resizing. Matches the bucket limit. */
export const STORED_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export interface MemberPhotoSelection {
  file: File | null;
  remove: boolean;
}

export function photoObjectPath(familyGroupId: string, memberId: string): string {
  return `${familyGroupId}/${memberId}.jpg`;
}

/** A sentence when the chosen file cannot be used, or null when it can. */
export function photoProblem(file: { type: string; size: number }): string | null {
  const type = file.type.trim().toLowerCase();
  if (type && !ACCEPTED_TYPES.has(type)) return "Choose a JPEG, PNG, or WebP picture.";
  if (file.size <= 0) return "That picture is empty.";
  if (file.size > MEMBER_PHOTO_MAX_BYTES) return "Choose a picture smaller than 12 MB.";
  return null;
}

/** Fit a picture inside the stored size, leaving smaller pictures unchanged. */
export function photoDrawSize(width: number, height: number, maxEdge = MEMBER_PHOTO_MAX_EDGE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 1, height: 1 };
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Resize to a JPEG the household bucket will accept. */
export async function memberPhotoBlob(file: Blob): Promise<Blob> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    throw new Error("This picture could not be prepared.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const size = photoDrawSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This picture could not be prepared.");
    context.fillStyle = "#fafaf9";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.86);
    });
    if (!blob) throw new Error("This picture could not be prepared.");
    return blob;
  } finally {
    bitmap.close();
  }
}
