import jsPDF from "jspdf";
import { UserProfile } from "../types";

export interface PDFLetterData {
  title: string;
  recipient?: string;
  date?: string;
  content: string;
  statutoryReference?: string;
  categoryLabel?: string;
}

/**
 * Synchronously renders the dark-teal (#01584D) oval handshake badge onto a
 * high-DPI offscreen canvas (140x96 scaled 4x -> 560x384 px) for razor-sharp
 * 10mm x 6.85mm PDF embedding.
 */
function renderTealHandshakePngDataUrl(): string | null {
  if (typeof document === "undefined" || typeof Path2D === "undefined") {
    return null;
  }
  try {
    const scale = 4;
    const width = 140 * scale;
    const height = 96 * scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // 1. Dark-teal horizontal oval (#01584D)
    ctx.fillStyle = "#01584D";
    ctx.beginPath();
    ctx.ellipse(70, 48, 68, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Left & right sleeve cuffs (#FFFFFF)
    ctx.fillStyle = "#FFFFFF";
    ctx.save();
    ctx.translate(26.5, 41);
    ctx.rotate((21 * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-9, -16, 17.5, 32, 2.6);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(113.5, 41);
    ctx.rotate((-21 * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-8.5, -16, 17.5, 32, 2.6);
    ctx.fill();
    ctx.restore();

    // 3. Left hand + palm + extended 4 fingers
    const leftHand = new Path2D(
      "M 41.5 29.5 L 55 31.2 C 61 24.8 70.2 25.5 76 31.4 L 62.5 43.2 C 58.6 46.8 60.4 52.8 65.8 53.2 C 69.5 53.5 72.5 50.8 77.2 46.8 L 101.2 66.8 C 103.8 69.0 103.8 73.2 101.2 75.6 C 98.8 77.8 95.2 77.5 92.8 75.2 L 85.4 68.8 L 94.4 76.8 C 96.8 79.0 96.8 82.8 94.4 85.1 C 92.0 87.3 88.4 87.1 86.0 84.9 L 78.2 77.8 L 85.5 84.6 C 87.8 86.8 87.7 90.4 85.4 92.5 C 83.1 94.6 79.6 94.5 77.3 92.3 L 40.5 59.5 L 34.0 54.5 Z"
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fill(leftHand);

    // 4. Right hand arching over top with thumb
    const rightHand = new Path2D(
      "M 99.5 29.2 L 89.2 31.5 C 81.8 25.0 72.2 24.6 64.8 31.2 L 54.2 40.8 C 51.4 43.4 51.6 47.6 54.5 49.8 C 57.3 51.9 61.3 51.3 63.8 48.8 L 71.2 41.6 C 73.4 39.5 76.8 39.5 79.1 41.4 L 100.8 59.4 L 106.2 54.2 Z"
    );
    ctx.strokeStyle = "#01584D";
    ctx.lineWidth = 3.2;
    ctx.lineJoin = "round";
    ctx.stroke(rightHand);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill(rightHand);

    // 5. Finger separation lines on bottom-right
    ctx.strokeStyle = "#01584D";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    const lines: Array<[number, number, number, number]> = [
      [84.5, 67.5, 96.5, 78.0],
      [77.2, 75.2, 88.8, 85.8],
      [70.2, 82.5, 79.5, 91.0],
    ];
    for (const [x1, y1, x2, y2] of lines) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 6. Four curled fingertips on bottom-left
    const knuckles: Array<[number, number, number, number, number]> = [
      [40.5, 57.5, 9.2, 14.5, 4.6],
      [47.2, 63.5, 9.2, 14.8, 4.6],
      [54.2, 69.2, 9.2, 14.5, 4.6],
      [61.5, 74.6, 8.8, 13.6, 4.4],
    ];
    ctx.lineWidth = 2.5;
    for (const [x, y, w, h, r] of knuckles) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((34 * Math.PI) / 180);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function downloadLetterAsPDF(
  letter: PDFLetterData,
  user?: Partial<UserProfile>
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header Bar (Navy #09213A + Safety Orange #D97724)
  doc.setFillColor(9, 33, 58);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setFillColor(255, 106, 0);
  doc.rect(0, 22, pageWidth, 2.5, "F");

  // Top header brand text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ASK ELON  ·  UK EMPLOYMENT LAW CORRESPONDENCE", margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 220, 240);
  const statuteText = letter.statutoryReference
    ? `Official Statutory Notice · ${letter.statutoryReference}`
    : "Official UK Employment Rights Correspondence";
  doc.text(statuteText, margin, 17);

  // Document details banner
  let currentY = 33;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(22, 27, 34);
  const cleanTitle = letter.title || "Employment Rights Formal Letter";
  doc.text(cleanTitle, margin, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 110);

  const displayDate =
    letter.date ||
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  doc.text(`Date of Issue: ${displayDate}`, margin, currentY);
  doc.text(
    `Recipient: ${letter.recipient || "Employer HR / Management"}`,
    margin + 85,
    currentY
  );

  currentY += 4.5;
  const senderName = user?.fullName || "Employee / Worker";
  const senderJob = user?.jobTitle ? ` (${user.jobTitle})` : "";
  doc.text(`Sender: ${senderName}${senderJob}`, margin, currentY);
  if (user?.employerName) {
    doc.text(`Employer: ${user.employerName}`, margin + 85, currentY);
  }

  // Divider line
  currentY += 5;
  doc.setDrawColor(210, 220, 230);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Letter content body (reserve bottom 25mm for handshake footer)
  currentY += 8;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(25, 30, 36);

  const cleanContent = letter.content.trim();
  const splitLines = doc.splitTextToSize(cleanContent, contentWidth);

  for (let i = 0; i < splitLines.length; i++) {
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentY = 22;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(25, 30, 36);
    }
    doc.text(splitLines[i], margin, currentY);
    currentY += 5.2;
  }

  // Stamp official handshake footer with ~32px (8.5mm) dark-teal oval badge across all pages
  const totalPages = doc.getNumberOfPages();
  const badgeDataUrl = renderTealHandshakePngDataUrl();
  const badgeWidthMm = 8.5;
  const badgeHeightMm = 5.83;
  const dividerY = pageHeight - 17.5;
  const badgeY = pageHeight - 14.1;
  const textX = margin + badgeWidthMm + 3;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle hairline separator above footer
    doc.setDrawColor(210, 220, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, dividerY, pageWidth - margin, dividerY);

    // ~32px (8.5mm) Dark-Teal (#01584D) Oval Handshake Badge on left
    if (badgeDataUrl) {
      doc.addImage(
        badgeDataUrl,
        "PNG",
        margin,
        badgeY,
        badgeWidthMm,
        badgeHeightMm
      );
    } else {
      doc.setFillColor(1, 88, 77);
      doc.ellipse(
        margin + badgeWidthMm / 2,
        badgeY + badgeHeightMm / 2,
        badgeWidthMm / 2,
        badgeHeightMm / 2,
        "F"
      );
    }

    // Two-line official Ask Elon footer copy (English for formal UK PDF output)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(22, 27, 34);
    doc.text(
      "Prepared with Ask Elon, your union mate in the UK · askelon.uk",
      textX,
      pageHeight - 11.7
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(90, 100, 110);
    doc.text(
      `This letter was prepared by the sender with the help of Ask Elon. It is not legal advice. Page ${p} of ${totalPages}`,
      textX,
      pageHeight - 8.1
    );
  }

  // Generate safe filename
  const safeTitle = cleanTitle
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 45);
  const filename = `${safeTitle || "Letter_from_Elon"}.pdf`;

  doc.save(filename);
}
