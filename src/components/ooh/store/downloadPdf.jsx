import { jsPDF } from "jspdf";

function toPlain(md) {
  return (md || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "•  ");
}

export function downloadItemPdf(item) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxW = doc.internal.pageSize.getWidth() - margin * 2;
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.splitTextToSize(item.title || "OOH Earth", maxW).forEach((l) => { doc.text(l, margin, y); y += 26; });
  if (item.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.splitTextToSize(item.subtitle, maxW).forEach((l) => { doc.text(l, margin, y); y += 16; });
    y += 6;
  }
  doc.setDrawColor(237, 255, 0);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 64, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.splitTextToSize(toPlain(item.content || item.description || ""), maxW).forEach((l) => {
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    doc.text(l, margin, y);
    y += 14;
  });
  doc.save(`${(item.title || "ooh-earth").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}