import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateQrBuffer, getCertificateVerifyUrl } from "./qr";

export interface CertificatePdfOptions {
  certificateId: string;
  learnerName: string;
  courseTitle: string;
  scorePercent: number;
  grade?: string | null;
  provisional?: boolean;
  completedAt: Date;
  issuerName?: string;
  issuerProgramme?: string;
  baseUrl?: string;
  isDemo?: boolean;
}

/**
 * Generates an institutional, printable A4 Landscape PDF certificate
 * with authentic ORELSE corporate branding and scannable QR verification code.
 */
export async function generateCertificatePdf(options: CertificatePdfOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // A4 Landscape: 841.89 × 595.28 points
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Load Standard Vector Fonts
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Palette definition
  const navy = rgb(0.102, 0.102, 0.18);       // #1A1A2E
  const gold = rgb(0.831, 0.686, 0.216);      // #D4AF37
  const goldLight = rgb(0.96, 0.93, 0.84);
  const skyBlue = rgb(0.243, 0.608, 0.859);   // #3E9BDB
  const charcoal = rgb(0.2, 0.23, 0.28);
  const slateGray = rgb(0.45, 0.49, 0.56);
  const cream = rgb(0.995, 0.995, 0.99);

  // 1. Draw Page Background & Luxury Borders
  page.drawRectangle({
    x: 10,
    y: 10,
    width: pageWidth - 20,
    height: pageHeight - 20,
    color: cream,
  });

  // Outer Gold Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: pageWidth - 40,
    height: pageHeight - 40,
    borderColor: gold,
    borderWidth: 2,
  });

  // Inner Navy Border
  page.drawRectangle({
    x: 26,
    y: 26,
    width: pageWidth - 52,
    height: pageHeight - 52,
    borderColor: navy,
    borderWidth: 1,
  });

  // Corner Accent Diamonds
  const cornerOffsets = [
    { x: 23, y: 23 },
    { x: pageWidth - 23, y: 23 },
    { x: 23, y: pageHeight - 23 },
    { x: pageWidth - 23, y: pageHeight - 23 },
  ];
  for (const pt of cornerOffsets) {
    page.drawSquare({
      x: pt.x - 3,
      y: pt.y - 3,
      size: 6,
      color: gold,
    });
  }

  // 2. Embed ORELSE Logo
  const logoPath = path.join(process.cwd(), "public", "brand", "orelse-logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const orelseImage = await pdfDoc.embedPng(new Uint8Array(logoBytes));
      const logoDims = orelseImage.scale(0.26); // scale appropriately for header
      page.drawImage(orelseImage, {
        x: (pageWidth - logoDims.width) / 2,
        y: pageHeight - 88,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (e) {
      console.warn("Failed to embed ORELSE logo into PDF:", e);
    }
  }

  // 3. Header Texts
  const titleText = "CERTIFICATE OF COMPLETION";
  const titleWidth = fontSerifBold.widthOfTextAtSize(titleText, 24);
  page.drawText(titleText, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 122,
    size: 24,
    font: fontSerifBold,
    color: navy,
  });

  const programmeSubtitle = (options.issuerProgramme || "ORELSE Learning Certification") + " • Learn LMS";
  const progWidth = fontSans.widthOfTextAtSize(programmeSubtitle, 9);
  page.drawText(programmeSubtitle, {
    x: (pageWidth - progWidth) / 2,
    y: pageHeight - 138,
    size: 9,
    font: fontSans,
    color: slateGray,
  });

  // Decorative Rule below header
  page.drawLine({
    start: { x: pageWidth / 2 - 120, y: pageHeight - 148 },
    end: { x: pageWidth / 2 + 120, y: pageHeight - 148 },
    thickness: 1,
    color: gold,
  });

  // "This is to certify that"
  const certifyText = "This is to certify that";
  const certifyWidth = fontSerifItalic.widthOfTextAtSize(certifyText, 13);
  page.drawText(certifyText, {
    x: (pageWidth - certifyWidth) / 2,
    y: pageHeight - 176,
    size: 13,
    font: fontSerifItalic,
    color: charcoal,
  });

  // 4. Learner Name (Hero element)
  const nameText = options.learnerName;
  const nameSize = 28;
  const nameWidth = fontSerifBold.widthOfTextAtSize(nameText, nameSize);
  page.drawText(nameText, {
    x: (pageWidth - nameWidth) / 2,
    y: pageHeight - 214,
    size: nameSize,
    font: fontSerifBold,
    color: navy,
  });

  // Underline for recipient name
  const underLineWidth = Math.max(nameWidth + 40, 260);
  page.drawLine({
    start: { x: (pageWidth - underLineWidth) / 2, y: pageHeight - 222 },
    end: { x: (pageWidth + underLineWidth) / 2, y: pageHeight - 222 },
    thickness: 1.5,
    color: gold,
  });

  // 5. Completion Description & Course Title
  const descText = "has fulfilled all institutional learning objectives and successfully passed the final assessment for";
  const descWidth = fontSans.widthOfTextAtSize(descText, 10.5);
  page.drawText(descText, {
    x: (pageWidth - descWidth) / 2,
    y: pageHeight - 250,
    size: 10.5,
    font: fontSans,
    color: charcoal,
  });

  const courseText = options.courseTitle;
  const courseSize = 18;
  const courseWidth = fontSerifBold.widthOfTextAtSize(courseText, courseSize);
  page.drawText(courseText, {
    x: (pageWidth - courseWidth) / 2,
    y: pageHeight - 280,
    size: courseSize,
    font: fontSerifBold,
    color: skyBlue,
  });

  // 6. Metrics & Results Card (Score, Grade, Completion Date)
  const gradeLabel = options.grade || (options.provisional ? "Pass (Provisional)" : "Pass");
  const scoreLabel = `${options.scorePercent.toFixed(1)}%`;
  const dateLabel = options.completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cardWidth = 460;
  const cardHeight = 48;
  const cardX = (pageWidth - cardWidth) / 2;
  const cardY = pageHeight - 355;

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: goldLight,
    borderColor: gold,
    borderWidth: 1,
  });

  // Metric 1: Final Score
  page.drawText("ASSESSMENT SCORE", {
    x: cardX + 30,
    y: cardY + 28,
    size: 8,
    font: fontSansBold,
    color: slateGray,
  });
  page.drawText(scoreLabel, {
    x: cardX + 30,
    y: cardY + 12,
    size: 13,
    font: fontSansBold,
    color: navy,
  });

  // Metric 2: Achieved Grade
  page.drawText("AWARDED GRADE", {
    x: cardX + 185,
    y: cardY + 28,
    size: 8,
    font: fontSansBold,
    color: slateGray,
  });
  page.drawText(gradeLabel, {
    x: cardX + 185,
    y: cardY + 12,
    size: 13,
    font: fontSansBold,
    color: navy,
  });

  // Metric 3: Completion Date
  page.drawText("DATE OF ISSUANCE", {
    x: cardX + 325,
    y: cardY + 28,
    size: 8,
    font: fontSansBold,
    color: slateGray,
  });
  page.drawText(dateLabel, {
    x: cardX + 325,
    y: cardY + 12,
    size: 11,
    font: fontSansBold,
    color: navy,
  });

  // 7. Embed Verification QR Code (Bottom Right)
  const qrBuffer = await generateQrBuffer(options.certificateId, { width: 180, margin: 1 });
  const qrImage = await pdfDoc.embedPng(new Uint8Array(qrBuffer));
  const qrSize = 82;
  const qrX = pageWidth - 145;
  const qrY = 46;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("SCAN TO VERIFY", {
    x: qrX - 2,
    y: qrY - 10,
    size: 7.5,
    font: fontSansBold,
    color: slateGray,
  });

  // 8. Signatory & Authority Block (Bottom Left)
  page.drawLine({
    start: { x: 50, y: 104 },
    end: { x: 260, y: 104 },
    thickness: 1,
    color: navy,
  });

  page.drawText("ORELSE Credentialing Directorate", {
    x: 50,
    y: 88,
    size: 10,
    font: fontSansBold,
    color: navy,
  });

  page.drawText("Authorized Digital Signatory • ORELSE", {
    x: 50,
    y: 75,
    size: 8.5,
    font: fontSans,
    color: slateGray,
  });

  // 9. Certificate ID & Verification URL (Bottom Center)
  const certIdLabel = `Certificate ID: ${options.certificateId}`;
  page.drawText(certIdLabel, {
    x: 290,
    y: 88,
    size: 8.5,
    font: fontSansBold,
    color: charcoal,
  });

  const verifyUrl = getCertificateVerifyUrl(options.certificateId, options.baseUrl);
  page.drawText(`Verify: ${verifyUrl}`, {
    x: 290,
    y: 75,
    size: 7.5,
    font: fontSans,
    color: slateGray,
  });

  // 10. Demo Watermark / Disclosure Pill (Center bottom)
  page.drawRectangle({
    x: (pageWidth - 270) / 2,
    y: 36,
    width: 270,
    height: 16,
    color: rgb(0.96, 0.96, 0.97),
    borderColor: rgb(0.85, 0.85, 0.88),
    borderWidth: 0.5,
  });

  const demoNotice = "DEMO CREDENTIAL • VERIFIABLE VIA MOCKLEDGER";
  const noticeWidth = fontSansBold.widthOfTextAtSize(demoNotice, 6.5);
  page.drawText(demoNotice, {
    x: (pageWidth - noticeWidth) / 2,
    y: 41,
    size: 6.5,
    font: fontSansBold,
    color: slateGray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
