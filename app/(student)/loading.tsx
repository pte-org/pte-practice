import { LoadingState } from "@/common/components";
import { COMMON_TEXT } from "@/common/constants";

export default function StudentLoading() {
  return <LoadingState message={COMMON_TEXT.loadingWorkspace} />;
}
