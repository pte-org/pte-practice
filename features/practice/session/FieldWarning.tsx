import { AppIcon } from "@/common/components";

/** Inline warning under a form field the student still has to fill in. */
export function FieldWarning({ message }: { message: string }) {
  return <p className="field-warning" role="alert"><AppIcon name="info" size={16} />{message}</p>;
}
