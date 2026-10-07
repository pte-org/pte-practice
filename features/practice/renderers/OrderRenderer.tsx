"use client";

import type { TaskRendererProps } from "./RendererTypes";

export function OrderRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const paragraphs = fixture.paragraphs ?? [];
  const savedOrder = Array.isArray(value.order)
    ? value.order.filter((item): item is string => typeof item === "string")
    : [];
  const order = savedOrder.length === paragraphs.length ? savedOrder : paragraphs.map((item) => item.id);
  const byId = new Map(paragraphs.map((paragraph) => [paragraph.id, paragraph]));

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ order: next });
  }

  return (
    <ol className="task-order-list">
      {order.map((id, index) => {
        const paragraph = byId.get(id);
        if (!paragraph) return null;
        return (
          <li className="task-order-row" key={id}>
            <span className="task-order-index">{index + 1}</span>
            <span className="task-order-text">{paragraph.text}</span>
            <span className="task-order-actions">
              <button type="button" className="icon-button" disabled={disabled || index === 0}
                aria-label={`Move paragraph ${index + 1} up`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="icon-button" disabled={disabled || index === order.length - 1}
                aria-label={`Move paragraph ${index + 1} down`} onClick={() => move(index, 1)}>↓</button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
