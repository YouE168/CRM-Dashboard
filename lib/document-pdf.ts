// Shared "download this document as a PDF" helper for Shared Documents
// (admin editor, group documents, and the member dashboard viewer).
//
// Captures an already-rendered DOM node and splits it across standard US
// Letter pages, instead of one giant custom-sized page. The node must be
// rendered at a fixed width (DOCUMENT_PAGE_WIDTH) - callers wrap it in a
// container with that explicit width so it never gets squeezed/clipped.
export const DOCUMENT_PAGE_WIDTH = 800;

export async function downloadNodeAsLetterPdf(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const [{ toCanvas }, { default: jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  const width = DOCUMENT_PAGE_WIDTH;
  const height = Math.ceil(node.scrollHeight);
  const canvas = await toCanvas(node, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    width,
    height,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Canvas pixels that fit on one PDF page at full page width.
  const scale = pageW / canvas.width;
  const sliceH = Math.floor(pageH / scale);

  let offset = 0;
  let pageIndex = 0;
  while (offset < canvas.height) {
    const thisSliceH = Math.min(sliceH, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = thisSliceH;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Couldn't prepare the PDF page.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, thisSliceH, 0, 0, canvas.width, thisSliceH);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, pageW, thisSliceH * scale);

    offset += thisSliceH;
    pageIndex += 1;
  }

  pdf.save(filename);
}
