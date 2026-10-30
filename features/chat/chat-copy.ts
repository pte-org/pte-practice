export interface ChatClipboard {
  writeText: (text: string) => Promise<void>;
}

/** Never throws: a blocked clipboard simply reports false and the student can select the text instead. */
export async function copyToClipboard(
  text: string,
  clipboard: ChatClipboard | undefined = typeof navigator === "undefined" ? undefined : navigator.clipboard,
): Promise<boolean> {
  if (!clipboard || text.trim() === "") return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
