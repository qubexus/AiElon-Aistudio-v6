import { Platform } from "react-native";

/**
 * Reads a recorded audio file and returns it as base64 plus a mime type the
 * backend can hand straight to Gemini.
 *
 * On web the recorder yields a `blob:` URL, so we fetch it and convert through
 * FileReader. On native the recorder yields a `file://` URL and we use
 * expo-file-system's base64 reader.
 */
export async function readRecordingAsBase64(
  uri: string
): Promise<{ audioBase64: string; mimeType: string }> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = blob.type || "audio/webm";
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the recording."));
      reader.onload = () => {
        const result = String(reader.result ?? "");
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.readAsDataURL(blob);
    });
    return { audioBase64, mimeType };
  }

  const FileSystem = await import("expo-file-system/legacy");
  const audioBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64" as never,
  });
  const lower = uri.toLowerCase();
  const mimeType = lower.endsWith(".wav")
    ? "audio/wav"
    : lower.endsWith(".webm")
      ? "audio/webm"
      : "audio/mp4";
  return { audioBase64, mimeType };
}
