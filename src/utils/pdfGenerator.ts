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

  const displayDate = letter.date || new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Date of Issue: ${displayDate}`, margin, currentY);
  doc.text(`Recipient: ${letter.recipient || "Employer HR / Management"}`, margin + 85, currentY);

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

  // Letter content body
  currentY += 8;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(25, 30, 36);

  const cleanContent = letter.content.trim();
  const splitLines = doc.splitTextToSize(cleanContent, contentWidth);

  for (let i = 0; i < splitLines.length; i++) {
    if (currentY > pageHeight - 22) {
      // Page footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(130, 140, 150);
      doc.text(
        "Generated with ask Elon - AI Employment Rights Companion for UK Workers",
        margin,
        pageHeight - 9
      );
      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        pageWidth - margin - 12,
        pageHeight - 9
      );

      doc.addPage();
      currentY = 22;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(25, 30, 36);
    }
    doc.text(splitLines[i], margin, currentY);
    currentY += 5.2;
  }

  // Final page footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(130, 140, 150);
  doc.text(
    "Generated with ask Elon - AI Employment Rights Companion for UK Workers",
    margin,
    pageHeight - 9
  );
  doc.text(
    `Page ${doc.getNumberOfPages()}`,
    pageWidth - margin - 12,
    pageHeight - 9
  );

  // Generate safe filename
  const safeTitle = cleanTitle
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 45);
  const filename = `${safeTitle || "Letter_from_Elon"}.pdf`;

  doc.save(filename);
}
