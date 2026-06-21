/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type PhotoResult = { webPath?: string };

function isCapacitor(): boolean {
  try {
    return !!(window as any).Capacitor?.isNativePlatform();
  } catch {
    return false;
  }
}

export async function getPhoto(options?: { quality?: number; allowEditing?: boolean; source?: string }): Promise<PhotoResult> {
  if (isCapacitor()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: options?.quality ?? 90,
      allowEditing: options?.allowEditing ?? false,
      resultType: CameraResultType.Uri,
      source: (options?.source as any) ?? CameraSource.Prompt,
    });
    return { webPath: image.webPath };
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        reject(new Error('No file selected'));
        return;
      }
      const url = URL.createObjectURL(file);
      document.body.removeChild(input);
      resolve({ webPath: url });
    });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      reject(new Error('User cancelled'));
    });

    setTimeout(() => input.click(), 100);
  });
}

export function compressImage(blob: Blob, maxDimension = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Kép tömörítés sikertelen'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Kép betöltése sikertelen'));
    img.src = URL.createObjectURL(blob);
  });
}

export async function uploadMedia(blob: Blob): Promise<string> {
  const compressed = blob.type.startsWith('image/') ? await compressImage(blob) : blob;
  const { uploadFile } = await import('./firebase');
  return uploadFile(compressed);
}
