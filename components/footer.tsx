"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MapPin, ArrowRight, Heart } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function Footer() {
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname?.includes("/onboarding") ||
    pathname?.includes("/dashboard") ||
    pathname?.includes("/settings")
  ) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter a valid email")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to subscribe")

      if (data.alreadySubscribed) {
        toast.success("You're already subscribed")
      } else {
        toast.success("Check your inbox to confirm")
      }
      setEmail("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to subscribe")
    }
    setIsSubmitting(false)
  }

  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <img
                  src="/swrk.svg"
                  className="w-8 h-8 text-primary-foreground"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight">Swrk™</span>
            </div>

            <p className="text-muted-foreground leading-relaxed text-sm">
              The intelligent job matching platform that connects talent with
              opportunity through mutual intent and AI-powered insights.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>New Delhi, IN</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>anshhkaushal@gmail.com</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Features", href: "/#features" },
                  { name: "Pricing", href: "/#pricing" },
                  { name: "About", href: "/about" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                Stay Connected
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                Get the latest updates on new features and career tips.
              </p>
            </div>

            <div className="space-y-3">
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50 text-sm"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button size="sm" className="px-4" disabled={isSubmitting}>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                © {new Date().getFullYear()} Swrk. All Rights Reserved
              </span>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground">
              <Link
                href="/signin"
                className="hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="hover:text-primary transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-primary/20 rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-1 h-1 bg-primary/30 rounded-full"
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.9, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full"
          animate={{
            y: [0, -25, 0],
            opacity: [0.25, 0.7, 0.25],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>
    </footer>
  )
}
