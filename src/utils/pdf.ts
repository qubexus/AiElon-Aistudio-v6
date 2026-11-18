import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders a formal letter to an A4 PDF and opens the native share sheet.
 * Returns true when a PDF was produced and shared.
 */
export async function exportLetterToPdf(
  title: string,
  body: string,
  footer = "Generated with Ask Elon \u2014 UK employment law assistant."
): Promise<boolean> {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 22mm 20mm; }
      body {
        font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0F1A24;
        font-size: 12pt;
        line-height: 1.55;
      }
      h1 { font-size: 15pt; margin: 0 0 18pt; letter-spacing: 0.3px; }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: inherit;
        margin: 0;
      }
      .footer {
        margin-top: 28pt;
        padding-top: 8pt;
        border-top: 1px solid #E6E1D6;
        font-size: 8.5pt;
        color: #526B7A;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <pre>${escapeHtml(body)}</pre>
    <div class="footer">${escapeHtml(footer)}</div>
  </body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === "web") {
    // On web, printToFileAsync opens the browser print dialog already.
    return Boolean(uri);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: title,
      UTI: "com.adobe.pdf",
    });
    return true;
  }
  return Boolean(uri);
}
