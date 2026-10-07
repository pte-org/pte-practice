import { UI_TEXT } from "../constants";
import type { TaskRendererProps } from "./RendererTypes";

export function UnsupportedRenderer({ fixture }: TaskRendererProps) {
  return (
    <div className="task-unsupported" role="status">
      <strong>{fixture.prompt}</strong>
      <p>{UI_TEXT.sessionUnsupported}</p>
    </div>
  );
}
