"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MapPin, ArrowRight, Heart } from "lucide-react"
import { usePathname } from "next/navigation"

const footerLinks = {
  product: [
    { name: "How It Works", href: "#" },
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "API", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
    { name: "Blog", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Contact Us", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
  resources: [
    { name: "Community", href: "#" },
    { name: "Guides", href: "#" },
    { name: "Webinars", href: "#" },
    { name: "Success Stories", href: "#" },
  ],
}

const socialLinks = [
  { name: "Instagram", icon: "/logos/instagram.svg", href: "#" },
  { name: "LinkedIn", icon: "/logos/linkedin.svg", href: "#" },
  { name: "GitHub", icon: "/logos/github.svg", href: "#" },
]

export default function Footer() {
  const pathname = usePathname()

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname.includes("/onboarding")
  ) {
    return null
  }

  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <motion.div
            className="lg:col-span-4 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <img
                    src="/swrk.svg"
                    className="w-8 h-8 text-primary-foreground"
                  />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary/20 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-2xl font-bold tracking-tight">Swrk</span>
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-sm">
              The intelligent job matching platform that connects talent with
              opportunity through mutual intent and AI-powered insights.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>hello@swrk.com</span>
              </div>
            </div>

            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-muted/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-colors group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-5 h-5 group-hover:brightness-110 transition-filter"
                  />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(
              ([category, links], categoryIndex) => (
                <motion.div
                  key={category}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-semibold text-foreground capitalize">
                    {category}
                  </h3>
                  <ul className="space-y-3">
                    {links.map((link, linkIndex) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors text-sm relative group"
                        >
                          {link.name}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ),
            )}
          </div>

          {/* Newsletter Section */}
          <motion.div
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Stay Connected
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get the latest updates on new features, job market insights, and
                career tips.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50"
                />
                <Button size="sm" className="px-4">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="mt-16 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2024 Swrk. Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for better careers.</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Animated Background Elements */}
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
