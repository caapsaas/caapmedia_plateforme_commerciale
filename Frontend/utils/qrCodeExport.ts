/** Rasterize the QR itself, without parsing the surrounding Tailwind CSS. */
export async function qrCodeToJpeg(svg: SVGSVGElement): Promise<string> {
  const width = Number(svg.getAttribute('width'));
  const height = Number(svg.getAttribute('height'));
  if (!(width > 0 && height > 0)) throw new Error('Invalid QR dimensions');

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to render QR SVG'));
      image.src = url;
    });

    const padding = 24;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = (width + padding * 2) * scale;
    canvas.height = (height + padding * 2) * scale;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.scale(scale, scale);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width + padding * 2, height + padding * 2);
    context.drawImage(image, padding, padding, width, height);
    return canvas.toDataURL('image/jpeg', 1);
  } finally {
    URL.revokeObjectURL(url);
  }
}
