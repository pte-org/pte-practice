import { describe, expect, it } from "vitest";
import { encodeWav } from "./audio-recorder";

describe("WAV recording encoder", () => {
  it("creates a mono PCM WAV payload", async () => {
    const blob = encodeWav([new Float32Array([0, 0.5, -0.5])], 16_000);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(blob.type).toBe("audio/wav");
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe("WAVE");
    expect(bytes.byteLength).toBe(50);
  });
});
