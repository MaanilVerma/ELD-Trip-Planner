/**
 * PDF export utility for daily log sheets.
 * Serializes SVG elements to high-resolution canvas images
 * and combines them into a multi-page PDF.
 */

function svgToCanvas(svg: SVGSVGElement, width: number, height: number): Promise<HTMLCanvasElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2x for crisp output
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to canvas'));
    };
    img.src = url;
  });
}

/**
 * Export all daily log SVGs within a container to a multi-page PDF.
 * Expects the container to have `.log-sheet-container svg` elements.
 */
export async function exportLogsToPdf(container: HTMLElement, filename = 'daily-logs.pdf'): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const pdfWidth = 297; // A4 landscape width in mm
  const pdfHeight = (520 / 1000) * pdfWidth; // maintain SVG aspect ratio
  const yOffset = (210 - pdfHeight) / 2; // center vertically on A4

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const svgs = container.querySelectorAll<SVGSVGElement>('.log-sheet-container svg');

  if (svgs.length === 0) return;

  for (let i = 0; i < svgs.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await svgToCanvas(svgs[i], 2000, 1040);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
  }

  pdf.save(filename);
}
