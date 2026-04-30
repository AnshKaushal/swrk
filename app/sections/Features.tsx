"use client"

import { motion } from "motion/react"
import { Calendar, ShieldCheck } from "lucide-react"

const features = [
  {
    title: "Mutual Intent Matching",
    description:
      "Conversations start only when both sides say yes, so every connection is intentional.",
    icon: (
      <img
        src="/icons/mutual-intent.svg"
        alt="Mutual Intent"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
  },
  {
    title: "AI-Powered Intelligence",
    description:
      "Signals beyond keywords for culture fit, growth potential, and alignment.",
    icon: (
      <img
        src="/icons/ai.svg"
        alt="AI-Powered Intelligence"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
  },
  {
    title: "Anonymous Direct Messaging",
    description:
      "Privacy-first chat with control over when you share contact details.",
    icon: (
      <img
        src="/icons/message.svg"
        alt="Privacy-First Design"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
  },
  {
    title: "Verified Professional Network",
    description:
      "Every profile is verified so you can build trust with confidence.",
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
  },
  {
    title: "Smart Scheduling",
    description:
      "Calendar sync, reminders, and interview coordination that never miss a beat.",
    icon: <Calendar className="h-6 w-6 text-primary" />,
  },
]

const highlights = [
  "For job seekers",
  "For recruiters",
  "Private by default",
  "Across mobile and desktop",
]

export default function Features() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-0">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/80">
              Built for decisive hiring
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Match faster. Hire smarter.
            </h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Swrk pairs mutual intent with AI intelligence to eliminate noise
              at every step of the hiring journey.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {highlights.map((item, index) => (
              <motion.span
                key={item}
                className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-foreground/80"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 * index }}
                viewport={{ once: true }}
              >
                {item}
              </motion.span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group rounded-2xl border border-border/60 bg-background/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4, delay: 0.08 * index }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted/30 p-2 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.6)]"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src="/images/feature-image.png"
              alt="Dashboard Preview"
              className="h-full w-full rounded-2xl border border-border/60 object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
