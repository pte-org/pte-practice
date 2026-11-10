"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import { PIP_COPY, PIP_MESSAGE_DURATION_MS } from "./constants";
import { useChatLauncher } from "@/features/chat/ChatLauncher";
import { PipArtwork } from "./PipArtwork";
import { schedulePipEncouragement } from "./schedulePipEncouragement";
import "./pip.css";

/** Pip opens the existing chat panel; chat owns requests, drafts and quota handling. */
export const PipCompanion = (): ReactElement => {
  const { locale, t } = useTranslation();
  const copy = PIP_COPY[locale];
  const [greetings, setGreetings] = useState(0);
  const [message, setMessage] = useState<"chatOpened" | "encouragement" | null>(null);
  const chat = useChatLauncher();
  const action = chat ? t("chat.toggleOpen") : copy.action;
  useEffect(() => {
    if (!message) return;
    // Recreate the timer after Fast Refresh as well as repeated clicks; a preserved bubble must never stick.
    const timer = setTimeout(() => setMessage(null), PIP_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, greetings]);
  useEffect(() => schedulePipEncouragement(() => {
    setMessage("encouragement");
    setGreetings((current) => current + 1);
  }, () => !document.hidden), [greetings]);
  const greet = () => {
    setGreetings((current) => current + 1);
    if (!chat) return;
    chat.open();
    setMessage("chatOpened");
  };
  return (
    <section className="pip-companion" aria-label={copy.name}>
      {message ? <div key={greetings} className="pip-speech-bubble" role="status" aria-live="polite">
        {copy[message]}
      </div> : null}
      <button type="button" className="pip-companion-button" aria-label={action}
        title={action} onClick={greet}>
        <PipArtwork key={greetings} animate greeting={greetings > 0} />
      </button>
    </section>
  );
};
