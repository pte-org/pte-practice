"use client";

import { useEffect } from "react";
import { stringArray } from "../answer-payloads";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { TaskRendererProps } from "./RendererTypes";

export function OrderRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const { t } = useLocale();
  const paragraphs = fixture.paragraphs ?? [];
  const savedOrder = stringArray(value.order);
  const hasSavedOrder = savedOrder.length === paragraphs.length;
  const order = hasSavedOrder ? savedOrder : paragraphs.map((item) => item.id);
  const byId = new Map(paragraphs.map((paragraph) => [paragraph.id, paragraph]));

  // The shown order is the answer; keep the form value in step so a learner who submits as-is sends it.
  useEffect(() => {
    if (!hasSavedOrder && order.length > 0 && !disabled) onChange({ order });
  }, [hasSavedOrder, order, disabled, onChange]);

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
                aria-label={`${t("score.moveUp")} ${index + 1}`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="icon-button" disabled={disabled || index === order.length - 1}
                aria-label={`${t("score.moveDown")} ${index + 1}`} onClick={() => move(index, 1)}>↓</button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
