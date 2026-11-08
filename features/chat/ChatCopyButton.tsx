"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon, Button } from "@/common/components";
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
    <Button variant="secondary" appearance="ghost" size="sm" iconOnly className="chat-copy"
      onClick={() => void copy()} aria-label={copied ? t("chat.copied") : t("chat.copy")}
      title={copied ? t("chat.copied") : t("chat.copy")}>
      <AppIcon name={copied ? "tick" : "copy"} size={15} />
      <span className="chat-sr-only" role="status">{copied ? t("chat.copied") : ""}</span>
    </Button>
  );
}
