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

export async function uploadMedia(blob: Blob): Promise<string> {
  const { uploadFile } = await import('./firebase');
  return uploadFile(blob);
}
