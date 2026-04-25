import CTA from "./sections/CTA"
import FeatureList from "./sections/FeatureList"
import Features from "./sections/Features"
import Hero from "./sections/Hero"
import Presence from "./sections/Presence"
import Pricing from "./sections/Pricing"
import Testimonials from "./sections/Testimonials"
import TrustedBy from "./sections/TrustedBy"

export default function page() {
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
