"use client"

import { motion } from "motion/react"
import {
  Sparkles,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Zap,
} from "lucide-react"

export default function Features() {
  return (
    <section className="relative isolate overflow-hidden bg-background px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
        {/* Header Section */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <motion.div
            className="lg:pr-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="lg:max-w-lg">
              <p className="text-base/7 font-semibold text-primary">
                Designed for definitive action
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                The Future of Talent Matching
              </h1>
              <p className="mt-6 text-xl/8 text-muted-foreground">
                We cut through the noise. A meticulously crafted ecosystem for
                employers and professionals who value time over endless
                browsing.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Sticky Image/Animation */}
        <motion.div
          className="-mt-12 -ml-12 p-12 lg:sticky lg:top-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="w-3xl max-w-none rounded-xl bg-gray-800 shadow-xl ring-1 ring-white/10 sm:w-228">
            <img
              src="https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=900&auto=format&fit=crop&q=60"
              alt="Dashboard Preview"
              className="w-full h-auto rounded-lg sm:rounded-2xl object-cover"
            />
          </div>
        </motion.div>

        {/* Features List Section */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <motion.div
            className="lg:pr-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="max-w-xl space-y-6 text-muted-foreground lg:max-w-lg">
              <p>
                Swrk revolutionizes how talent and opportunity connect. By
                combining mutual intent matching with AI-powered insights, we
                eliminate the friction from every stage of the hiring process.
              </p>

              <ul role="list" className="space-y-6">
                <motion.li
                  className="flex gap-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-none">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Mutual Intent Matching
                    </h3>
                    <p className="mt-2 text-sm">
                      Conversations only start when both sides say "yes". No
                      more cold outreach, no more black hole applications. Every
                      connection is intentional.
                    </p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex gap-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-none">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      AI-Powered Intelligence
                    </h3>
                    <p className="mt-2 text-sm">
                      Our matching engine learns from every interaction. It goes
                      beyond keywords to understand culture fit, growth
                      potential, and career alignment.
                    </p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex gap-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-none">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Anonymous Direct Messaging
                    </h3>
                    <p className="mt-2 text-sm">
                      Communicate safely without exposing personal information.
                      Control when and how you share contact details.
                    </p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex gap-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-none">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Verified Professional Network
                    </h3>
                    <p className="mt-2 text-sm">
                      Every profile is verified and authentic. Build
                      relationships with confidence knowing everyone is who they
                      say they are.
                    </p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex gap-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="flex-none">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Smart Scheduling
                    </h3>
                    <p className="mt-2 text-sm">
                      Seamlessly coordinate interviews with integrated calendar
                      sync. Never miss an opportunity with automated reminders
                      and intelligent scheduling.
                    </p>
                  </div>
                </motion.li>
              </ul>

              <motion.div
                className="pt-8 border-t border-border/50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  Designed for Everyone
                </h3>
                <p className="mt-4 text-sm">
                  Whether you're a job seeker looking for your next opportunity
                  or a recruiter building your ideal team, Swrk provides the
                  tools you need. Our platform works seamlessly across mobile,
                  tablet, and desktop, ensuring you stay connected wherever you
                  are.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
