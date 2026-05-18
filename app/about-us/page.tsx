"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, Lightbulb, Users, Zap } from "lucide-react"

const values = [
  {
    icon: <Target className="h-6 w-6 text-primary" />,
    title: "Intent Over Everything",
    description:
      "We believe in meaningful connections. No spam, no cold outreach — just genuine mutual interest.",
  },
  {
    icon: <Lightbulb className="h-6 w-6 text-primary" />,
    title: "Simplicity Through AI",
    description:
      "Technology should make life easier, not complicated. We use AI to cut through noise and find real matches.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Trust & Privacy First",
    description:
      "Your data is yours. We never sell it, and you control every step of sharing your information.",
  },
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "Speed Meets Quality",
    description:
      "Get results fast without compromising on quality. Better candidates faster. Better jobs quicker.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/80">
              About Mutch
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Reimagining the job market
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              We're building a platform where talent meets opportunity through
              mutual intent and AI intelligence. No spray and pray. No
              algorithmic guesses. Just real connections between people who
              actually want to work together.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/signin">
              <Button size="lg">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#features">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
            animate={{
              y: [0, 20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>
      </section>

      {/* Values Section */}
      <section className="relative overflow-hidden bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          <motion.div
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/80">
              Our Foundation
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Built on four core values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {value.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative overflow-hidden bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 lg:grid lg:grid-cols-2 lg:gap-64 lg:space-y-0">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/80">
                Our Mission
              </p>
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                Why we exist
              </h2>
            </div>

            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              The traditional job market is broken. People open to work spray
              applications everywhere, hiring teams drown in noise, and
              everyone&apos;s time gets wasted on bad fits.
            </p>

            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              We're here to change that. By combining the power of mutual intent
              with AI intelligence, we're creating a smarter, faster, fairer way
              for talent and opportunity to find each other.
            </p>

            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Every person deserves a job that energizes them. Every company
              deserves talent that excites them. We're building the platform to
              make that happen.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border/50 bg-card p-8 sm:p-12"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary">100%</h3>
                <p className="text-sm text-muted-foreground">
                  Intentional connections
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary">Real-time</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered matching
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary">Your data</h3>
                <p className="text-sm text-muted-foreground">
                  Always in your hands
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary">
                  For everyone
                </h3>
                <p className="text-sm text-muted-foreground">
                  People open to work and hiring teams alike
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Ready to find your perfect fit?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of professionals who are already using Mutch to
              make meaningful career connections.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link href="/signup">
              <Button size="lg">
                Join Mutch Today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
