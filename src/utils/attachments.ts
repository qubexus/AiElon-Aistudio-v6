import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import type { AttachmentKind, AttachmentSource, CaseAttachment } from "../types";

const FOLDER = `${FileSystem.documentDirectory ?? ""}attachments/`;

/** Create the attachments folder once; safe to call repeatedly. */
async function ensureFolder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const info = await FileSystem.getInfoAsync(FOLDER);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(FOLDER, { intermediates: true });
    }
  } catch {
    // Non-fatal: we fall back to the original URI below.
  }
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
}

function extensionFor(mimeType: string, fallback: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/heic": "heic",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return map[mimeType] ?? fallback;
}

/**
 * Copy a picked/captured file into the app sandbox so it is not wiped when the
 * OS clears the cache directory. Returns the durable URI.
 */
async function persist(uri: string, name: string): Promise<string> {
  if (Platform.OS === "web") return uri;
  await ensureFolder();
  const target = `${FOLDER}${Date.now().toString(36)}_${safeName(name)}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
}

async function sizeOf(uri: string): Promise<number> {
  if (Platform.OS === "web") return 0;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && typeof info.size === "number" ? info.size : 0;
  } catch {
    return 0;
  }
}

export interface PickedAttachment {
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  source: AttachmentSource;
}

/** Take a photo with the system camera UI (fallback for the in-app camera). */
export async function captureWithSystemCamera(): Promise<PickedAttachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    exif: false,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  const name = asset.fileName ?? `photo-${Date.now()}.${extensionFor(mimeType, "jpg")}`;
  const uri = await persist(asset.uri, name);

  return {
    name,
    uri,
    mimeType,
    size: asset.fileSize ?? (await sizeOf(uri)),
    kind: "photo",
    source: "camera",
  };
}

/**
 * Wrap a photo taken by the in-app camera route (`app/camera.tsx`), which hands
 * back a raw cache URI through `cameraBus`.
 */
export async function captureFromUri(uri: string): Promise<PickedAttachment> {
  const mimeType = "image/jpeg";
  const name = `photo-${Date.now()}.jpg`;
  const durable = await persist(uri, name);
  return {
    name,
    uri: durable,
    mimeType,
    size: await sizeOf(durable),
    kind: "photo",
    source: "camera",
  };
}

/** Pick one or more photos from the device gallery. */
export async function pickPhotos(): Promise<PickedAttachment[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: true,
    selectionLimit: 10,
    exif: false,
  });
  if (result.canceled || !result.assets?.length) return [];

  const out: PickedAttachment[] = [];
  for (const asset of result.assets) {
    const mimeType = asset.mimeType ?? "image/jpeg";
    const name = asset.fileName ?? `photo-${Date.now()}.${extensionFor(mimeType, "jpg")}`;
    const uri = await persist(asset.uri, name);
    out.push({
      name,
      uri,
      mimeType,
      size: asset.fileSize ?? (await sizeOf(uri)),
      kind: "photo",
      source: "library",
    });
  }
  return out;
}

/** Pick documents (PDF, DOCX, images — whatever the OS file browser exposes). */
export async function pickDocuments(): Promise<PickedAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "image/*",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return [];

  const out: PickedAttachment[] = [];
  for (const asset of result.assets) {
    const mimeType = asset.mimeType ?? "application/octet-stream";
    const name = asset.name || `document-${Date.now()}`;
    const uri = await persist(asset.uri, name);
    out.push({
      name,
      uri,
      mimeType,
      size: asset.size ?? (await sizeOf(uri)),
      kind: mimeType.startsWith("image/") ? "photo" : "document",
      source: "files",
    });
  }
  return out;
}

/** Wrap a picked asset into the persisted case model. */
export function toCaseAttachment(
  caseId: string,
  picked: PickedAttachment,
  id: string,
  createdAt: string
): CaseAttachment {
  return {
    id,
    caseId,
    kind: picked.kind,
    name: picked.name,
    uri: picked.uri,
    mimeType: picked.mimeType,
    size: picked.size,
    createdAt,
    source: picked.source,
  };
}

/** Remove the underlying file; ignores missing files. */
export async function deleteAttachmentFile(uri: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Nothing to clean up.
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
