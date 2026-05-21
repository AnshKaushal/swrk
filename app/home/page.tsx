import type { Metadata } from "next"
import HomePage from "@/components/home-page"

export const metadata: Metadata = {
  title: "Home | Swrk",
  description:
    "Browse the Swrk landing experience and learn how mutual hiring works for candidates and employers.",
}

export default function HomeRoutePage() {
  return <HomePage />
}
