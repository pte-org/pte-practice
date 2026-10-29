"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { copyToClipboard } from "./chat-copy";

const COPIED_LABEL_MS = 2000;

/** Copies one answer's markdown source, so templates paste with their own formatting. */
export function ChatCopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (!(await copyToClipboard(text))) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_LABEL_MS);
  };

  return (
    <button type="button" className="chat-copy" onClick={() => void copy()}>
      {copied ? <AppIcon name="check" size={14} /> : null}
      <span role="status">{copied ? t("chat.copied") : t("chat.copy")}</span>
    </button>
  );
}
