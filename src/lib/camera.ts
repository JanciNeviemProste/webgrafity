import { CameraOptions } from '@/types';

export async function startCameraStream(
  options: CameraOptions = {}
): Promise<MediaStream> {
  const {
    facingMode = 'environment',
    width = 1280,
    height = 720,
  } = options;

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: width },
      height: { ideal: height },
    },
  });
}

export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
}

export function createVideoElement(stream: MediaStream): HTMLVideoElement {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.play();
  return video;
}
