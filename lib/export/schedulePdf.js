/**
 * Turn the off-screen <SchedulePrintable> node into a downloadable A4 PDF.
 *
 * We rasterise the DOM (html2canvas) rather than write text with jsPDF because
 * the plan contains complex scripts (Malayalam, Devanagari, Arabic) that a text
 * PDF font cannot shape — the browser already shaped them correctly on screen,
 * so a picture of that is faithful. The tall canvas is then sliced into A4-height
 * strips, one per PDF page.
 *
 * jspdf + html2canvas are imported dynamically so they stay out of the initial
 * bundle and only load when a user actually downloads.
 */
const A4 = { w: 595.28, h: 841.89 }; // pt (jsPDF "a4")
const MARGIN = 24; // pt

export async function downloadSchedulePdf(node, filename = "study-plan.pdf") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(node, {
    scale: 2, // crisp text
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const contentW = A4.w - MARGIN * 2;
  const contentH = A4.h - MARGIN * 2;
  // px-per-pt so we can map an A4 page height back into source-canvas pixels
  const pxPerPt = canvas.width / contentW;
  const pageHpx = Math.floor(contentH * pxPerPt);

  let rendered = 0;
  let first = true;
  while (rendered < canvas.height) {
    const sliceHpx = Math.min(pageHpx, canvas.height - rendered);

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHpx;
    const ctx = slice.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, rendered, canvas.width, sliceHpx, 0, 0, canvas.width, sliceHpx);

    if (!first) pdf.addPage();
    first = false;
    const imgH = sliceHpx / pxPerPt; // pt
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN, MARGIN, contentW, imgH);

    rendered += sliceHpx;
  }

  pdf.save(filename);
}

/** Filesystem-safe filename from student name + class. */
export function scheduleFilename(name, cls) {
  const slug = (s) => (s || "").trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  const parts = ["study-plan", slug(name), slug(cls)].filter(Boolean);
  return `${parts.join("-").toLowerCase()}.pdf`;
}
