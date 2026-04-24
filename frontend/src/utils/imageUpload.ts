const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 800; // Max width or height for compression (reduced for smaller payloads)

import { getApiOriginUrl } from '../services/apiBase';

const API_ORIGIN = getApiOriginUrl();
export interface ImageUploadResult {
  url: string;
  size: number;
}

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_ORIGIN}${url}`;
  }

  return `${API_ORIGIN}/${url}`;
};

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
  '<rect width="100%" height="100%" fill="%23e5e7eb"/>' +
  '<rect x="120" y="120" width="400" height="240" fill="%23f3f4f6" stroke="%23d1d5db" stroke-width="2"/>' +
  '<path d="M160 320l120-120 80 80 80-80 120 120" fill="none" stroke="%23cbd5f5" stroke-width="8"/>' +
  '<circle cx="260" cy="200" r="24" fill="%23d1d5db"/>' +
  '</svg>';

export const getProductImageSrc = (url?: string | null): string => {
  return url ? resolveImageUrl(url) : PLACEHOLDER_IMAGE;
};

/**
 * Validates an image file
 */
export const validateImageFile = (file: File): string | null => {
  if (!file) {
    return 'No file selected';
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
  }

  return null;
};

/**
 * Compresses an image by resizing it
 */
const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.5): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
};

/**
 * Resizes image to fit within MAX_DIMENSION while maintaining aspect ratio
 */
const resizeImage = (
  img: HTMLImageElement,
): { canvas: HTMLCanvasElement; width: number; height: number } => {
  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > MAX_DIMENSION) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    }
  } else {
    if (height > MAX_DIMENSION) {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, width, height };
};

/**
 * Converts a file to an optimized data URL with aggressive compression
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = new Image();
        img.onload = async () => {
          // Resize if too large
          const { canvas } = resizeImage(img);

          // Compress with low quality for smaller payload
          const blob = await compressImage(canvas, 0.5);
          const compressedReader = new FileReader();
          compressedReader.onload = () => {
            resolve(compressedReader.result as string);
          };
          compressedReader.onerror = reject;
          compressedReader.readAsDataURL(blob);
        };
        img.onerror = reject;
        img.src = reader.result as string;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads an image file to the server
 * Automatically compresses and resizes the image to reduce payload size
 */
export const uploadImage = async (file: File): Promise<ImageUploadResult> => {
  const error = validateImageFile(file);
  if (error) {
    throw new Error(error);
  }

  const url = await fileToDataUrl(file);

  return {
    url,
    size: url.length, // Size of the compressed data URL
  };
};

/**
 * Validates an image URL
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Converts data URL to File object
 */
export const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
};
