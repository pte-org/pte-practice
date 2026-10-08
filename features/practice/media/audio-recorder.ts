export type RecorderErrorCode = "UNSUPPORTED" | "PERMISSION_DENIED" | "NO_DEVICE" | "BUSY" | "FAILED";

export class RecorderError extends Error {
  constructor(public readonly code: RecorderErrorCode) {
    super(code);
    this.name = "RecorderError";
  }
}

interface AudioContextWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export interface WavRecorderHandle {
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export async function startWavRecording(): Promise<WavRecorderHandle> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new RecorderError("UNSUPPORTED");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new RecorderError(mapRecorderError(error));
  }

  const AudioContextConstructor = (window as AudioContextWindow).AudioContext
    ?? (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextConstructor) {
    stopTracks(stream);
    throw new RecorderError("UNSUPPORTED");
  }

  let context: AudioContext;
  try {
    context = new AudioContextConstructor();
    await context.resume();
  } catch {
    stopTracks(stream);
    throw new RecorderError("UNSUPPORTED");
  }

  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  let stopped = false;
  let finalBlob: Blob | null = null;
  processor.onaudioprocess = (event) => {
    if (!stopped) chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(context.destination);

  const dispose = () => {
    if (stopped) return;
    stopped = true;
    processor.disconnect();
    source.disconnect();
    stopTracks(stream);
    void context.close();
  };

  return {
    stop: async () => {
      if (!finalBlob) {
        dispose();
        finalBlob = encodeWav(chunks, context.sampleRate);
      }
      return finalBlob;
    },
    cancel: dispose,
  };
}

export function encodeWav(chunks: readonly Float32Array[], sampleRate: number): Blob {
  const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function stopTracks(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

function mapRecorderError(error: unknown): RecorderErrorCode {
  if (!(error instanceof DOMException)) return "FAILED";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") return "PERMISSION_DENIED";
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "NO_DEVICE";
  if (error.name === "NotReadableError" || error.name === "TrackStartError") return "BUSY";
  if (error.name === "OverconstrainedError") return "UNSUPPORTED";
  return "FAILED";
}
