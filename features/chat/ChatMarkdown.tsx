import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeChatHref } from "./chat-links";

/**
 * Answers come from a model, so they are treated as untrusted: raw HTML is dropped, images are never
 * rendered (a remote image can leak the page to a third party), and a link is created only for web and
 * mail schemes. Tables and code blocks get a scroll wrapper because the panel is narrow.
 */
const COMPONENTS: Components = {
  img: () => null,
  a: ({ href, children }) => (isSafeChatHref(href)
    ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    : <>{children}</>),
  table: ({ children }) => <div className="chat-md-scroll"><table>{children}</table></div>,
  pre: ({ children }) => <pre className="chat-md-pre">{children}</pre>,
};

export function ChatMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="chat-markdown prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={COMPONENTS}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
