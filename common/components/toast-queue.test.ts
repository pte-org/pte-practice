import { describe, expect, it } from "vitest";
import { addToastToQueue, removeToastFromQueue, type ToastItem } from "./toast-queue";

describe("toast-queue", () => {
  const item = (id: string): ToastItem => ({
    id,
    tone: "info",
    message: `Message ${id}`,
    dismissible: true,
  });

  it("caps toast queue to maximum 3 visible toasts", () => {
    let queue: ToastItem[] = [];
    queue = addToastToQueue(queue, item("1"));
    queue = addToastToQueue(queue, item("2"));
    queue = addToastToQueue(queue, item("3"));
    expect(queue.map((t) => t.id)).toEqual(["1", "2", "3"]);

    queue = addToastToQueue(queue, item("4"));
    expect(queue.map((t) => t.id)).toEqual(["2", "3", "4"]);
  });

  it("removes toast by id", () => {
    const queue = [item("1"), item("2"), item("3")];
    const updated = removeToastFromQueue(queue, "2");
    expect(updated.map((t) => t.id)).toEqual(["1", "3"]);
  });
});
