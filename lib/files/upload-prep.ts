// Utilities for client-side file preparation prior to upload

export async function compressImageIfNeeded(
  file: File,
  {
    maxBytes = 5 * 1024 * 1024,
    maxDimension = 2048,
    targetMime = 'image/jpeg',
    minQuality = 0.5,
  }: {
    maxBytes?: number;
    maxDimension?: number;
    targetMime?: 'image/jpeg';
    minQuality?: number;
  } = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= maxBytes) return file;

  // Only compress JPEG/PNG. Leave others unchanged.
  if (!['image/jpeg', 'image/png'].includes(file.type)) return file;

  const loadImage = (fileToLoad: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(fileToLoad);
    });
  };

  const toBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(blob);
        },
        type,
        quality,
      );
    });

  try {
    const img = await loadImage(file);

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.max(1, Math.floor(width * scale));
    height = Math.max(1, Math.floor(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.9;
    let blob = await toBlob(canvas, targetMime, quality);

    // Reduce quality until under size or threshold
    while (blob.size > maxBytes && quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.1);
      blob = await toBlob(canvas, targetMime, quality);
    }

    // Downscale further if still too large
    while (
      blob.size > maxBytes &&
      Math.max(canvas.width, canvas.height) > 512
    ) {
      const downscale = 0.85;
      const newW = Math.max(1, Math.floor(canvas.width * downscale));
      const newH = Math.max(1, Math.floor(canvas.height * downscale));
      const tmp = document.createElement('canvas');
      tmp.width = newW;
      tmp.height = newH;
      const tctx = tmp.getContext('2d');
      if (!tctx) break;
      tctx.drawImage(canvas, 0, 0, newW, newH);
      canvas.width = newW;
      canvas.height = newH;
      const cctx = canvas.getContext('2d');
      if (!cctx) break;
      cctx.drawImage(tmp, 0, 0);
      blob = await toBlob(canvas, targetMime, quality);
    }

    if (blob.size >= file.size) {
      return file;
    }

    const base = file.name.replace(/\.[^.]+$/, '');
    const newExt = 'jpg';
    const newName = `${base}.${newExt}`;
    return new File([blob], newName, {
      type: targetMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function processFilesForUpload(
  files: File[],
  options?: {
    maxBytes?: number;
    maxDimension?: number;
    targetMime?: 'image/jpeg';
  },
): Promise<{
  processedImages: File[];
  pdfFiles: File[];
  stillOversized: File[];
  unsupportedFiles: File[];
}> {
  const processedImages: File[] = [];
  const pdfFiles: File[] = [];
  const stillOversized: File[] = [];
  const unsupportedFiles: File[] = [];
  const maxBytes = options?.maxBytes ?? 5 * 1024 * 1024;

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const maybeCompressed = await compressImageIfNeeded(file, options);
      if (maybeCompressed.size > maxBytes) {
        stillOversized.push(file);
        continue;
      }
      processedImages.push(maybeCompressed);
    } else if (file.type === 'application/pdf') {
      if (file.size > maxBytes) {
        stillOversized.push(file);
        continue;
      }
      pdfFiles.push(file);
    } else {
      unsupportedFiles.push(file);
    }
  }

  return { processedImages, pdfFiles, stillOversized, unsupportedFiles };
}
