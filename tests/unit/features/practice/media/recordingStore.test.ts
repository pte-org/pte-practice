import { describe, expect, it } from "vitest";
import {
  createRecordingStore, RECORDING_KEEP_MS, type RecordingStoreBackend, type StoredRecording,
} from "@/features/practice/media/recordingStore";

function memoryBackend(): RecordingStoreBackend & { map: Map<string, StoredRecording> } {
  const map = new Map<string, StoredRecording>();
  return {
    map,
    put: async (key, record) => { map.set(key, record); },
    getAll: async () => [...map.values()],
    delete: async (key) => { map.delete(key); },
    clear: async () => { map.clear(); },
  };
}

const blob = new Blob(["wav"], { type: "audio/wav" });

describe("recording store", () => {
  it("keeps a recording per session item until it is removed", async () => {
    const store = createRecordingStore(memoryBackend(), () => 1000);
    await store.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 12 });
    await store.save({ sessionId: "s1", itemId: "i2", blob, durationSeconds: 8 });
    await store.save({ sessionId: "s2", itemId: "i1", blob, durationSeconds: 5 });

    expect((await store.listForSession("s1")).map((record) => record.itemId).sort()).toEqual(["i1", "i2"]);
    await store.remove("s1", "i1");
    expect((await store.listForSession("s1")).map((record) => record.itemId)).toEqual(["i2"]);
  });

  it("replaces an item's recording when it is recorded again", async () => {
    const store = createRecordingStore(memoryBackend(), () => 1000);
    await store.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 12 });
    await store.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 20 });

    const kept = await store.listForSession("s1");
    expect(kept).toHaveLength(1);
    expect(kept[0]?.durationSeconds).toBe(20);
  });

  it("drops recordings older than a week", async () => {
    let now = 0;
    const backend = memoryBackend();
    const store = createRecordingStore(backend, () => now);
    await store.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 12 });
    now = RECORDING_KEEP_MS + 1;

    expect(await store.listForSession("s1")).toEqual([]);
    expect(backend.map.size).toBe(0);
  });

  it("keeps nothing and never throws without storage or when storage fails", async () => {
    const missing = createRecordingStore(null);
    await missing.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 1 });
    expect(await missing.listForSession("s1")).toEqual([]);

    const failing = createRecordingStore({
      put: async () => { throw new Error("quota"); },
      getAll: async () => { throw new Error("blocked"); },
      delete: async () => { throw new Error("blocked"); },
      clear: async () => { throw new Error("blocked"); },
    });
    await expect(failing.save({ sessionId: "s1", itemId: "i1", blob, durationSeconds: 1 })).resolves.toBeUndefined();
    await expect(failing.listForSession("s1")).resolves.toEqual([]);
  });
});
