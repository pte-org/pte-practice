import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { normalizeAssistantName, readAssistantName, resetAssistantName, saveAssistantName,
  subscribeAssistantName } from "@/features/chat/assistant-name";
import { ASSISTANT_NAME_CHANGE_EVENT, ASSISTANT_NAME_STORAGE_KEY } from "@/features/chat/constants";
import { ChatHeader } from "@/features/chat/ChatHeader";

// Exercise the client snapshot using existing server rendering tools, without a browser or new dependencies.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));

describe("device-only assistant name", () => {
  let values: Map<string, string>;
  let events: EventTarget;
  beforeEach(() => {
    values = new Map([["background-preference", "keep"]]);
    events = new EventTarget();
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) },
      addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("normalizes names and supports Vietnamese and emoji", () => {
    expect(normalizeAssistantName("  Bé   Cánh Xanh 🐦  ")).toBe("Bé Cánh Xanh 🐦");
    expect(normalizeAssistantName("🐦".repeat(32))).toBe("🐦".repeat(32));
  });
  it("rejects empty, overlong or control-character preferences", () => {
    for (const name of [null, "", "  ", "a".repeat(33), "bad\u0000name", "bad\u0081name"]) {
      expect(normalizeAssistantName(name)).toBeNull();
    }
  });
  it("saves only the name locally and restores the default without removing other preferences", () => {
    expect(saveAssistantName("Sky")).toBe(true);
    expect(readAssistantName()).toBe("Sky");
    expect(values.get(ASSISTANT_NAME_STORAGE_KEY)).toBe("Sky");
    expect(resetAssistantName()).toBe(true);
    expect(readAssistantName()).toBeNull();
    expect(values.get("background-preference")).toBe("keep");
  });
  it("updates subscribers immediately and cleans up listeners", () => {
    const notify = vi.fn();
    const stop = subscribeAssistantName(notify);
    saveAssistantName("Sky");
    expect(notify).toHaveBeenCalledOnce();
    stop();
    events.dispatchEvent(new Event(ASSISTANT_NAME_CHANGE_EVENT));
    expect(notify).toHaveBeenCalledOnce();
  });
  it("responds to name changes in another tab and ignores unrelated storage events", () => {
    const notify = vi.fn();
    const stop = subscribeAssistantName(notify);
    events.dispatchEvent(Object.assign(new Event("storage"), { key: "other" }));
    expect(notify).not.toHaveBeenCalled();
    events.dispatchEvent(Object.assign(new Event("storage"), { key: ASSISTANT_NAME_STORAGE_KEY }));
    events.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
    expect(notify).toHaveBeenCalledTimes(2);
    stop();
  });
  it("handles blocked browser storage without reporting a successful save", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("blocked"); } });
    expect(readAssistantName()).toBeNull();
    expect(saveAssistantName("Sky")).toBe(false);
    expect(resetAssistantName()).toBe(false);
  });
  it("renders the personalized name safely and keeps rename and new-chat controls distinct", () => {
    saveAssistantName("Sky <buddy>");
    const noop = vi.fn();
    const drag = { onPointerDown: noop, onPointerMove: noop, onPointerUp: noop, onPointerCancel: noop,
      onLostPointerCapture: noop, onMoveKeyDown: noop };
    const html = renderToStaticMarkup(<LocaleProvider><ChatHeader drag={drag} pending={false}
      onNewChat={noop} onClose={noop} /></LocaleProvider>);
    expect(html).toContain("Sky &lt;buddy&gt;");
    expect(html).toContain('aria-label="Rename assistant"');
    expect(html).toContain('aria-label="New chat"');
  });
});
