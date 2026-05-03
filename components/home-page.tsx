"use client"

import CTA from "@/app/sections/CTA"
import FeatureList from "@/app/sections/FeatureList"
import Features from "@/app/sections/Features"
import Hero from "@/app/sections/Hero"
import Presence from "@/app/sections/Presence"
import Pricing from "@/app/sections/Pricing"
import Testimonials from "@/app/sections/Testimonials"
import TrustedBy from "@/app/sections/TrustedBy"

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Presence />
      <FeatureList />
      <Features />
      <TrustedBy />
      <Testimonials />
      <Pricing />
      <CTA />
    </div>
  )
}
