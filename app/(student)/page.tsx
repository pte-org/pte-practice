import { HomeView } from "@/features/home/HomeView";

// Next's dev server dropped this segment from instant-navigation validation ("instant-unrendered-segment"), which
// can stall the client navigation from sign-in to home; opt out like the student layout does.
export const instant = false;

export default function HomePage() {
  return <HomeView />;
}
