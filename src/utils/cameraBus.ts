/**
 * Tiny hand-off channel between the full-screen camera route and the screen that
 * opened it. expo-router has no "return a value" API, so the caller registers a
 * handler before navigating and the camera route calls it on capture.
 */

type PhotoHandler = (uri: string) => void | Promise<void>;

let handler: PhotoHandler | null = null;

export function setPhotoHandler(next: PhotoHandler | null): void {
  handler = next;
}

export async function deliverPhoto(uri: string): Promise<void> {
  const current = handler;
  handler = null;
  if (current) await current(uri);
}
