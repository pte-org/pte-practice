import { ErrorPage } from "@/common/components";

/** Every unknown address and every notFound() of the app. */
export default function NotFound() {
  return <ErrorPage kind="notFound" fullScreen />;
}
