"use client"

import { motion } from "motion/react"
import { Calendar, ShieldCheck } from "lucide-react"

const features = [
  {
    title: "Mutual Intent Matching",
    description:
      'Conversations only start when both sides say "yes". No more cold outreach, no more black hole applications. Every connection is intentional.',
    icon: (
      <img
        src="/icons/mutual-intent.svg"
        alt="Mutual Intent"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
    delay: 0.1,
  },
  {
    title: "AI-Powered Intelligence",
    description:
      "Our matching engine learns from every interaction. It goes beyond keywords to understand culture fit, growth potential, and career alignment.",
    icon: (
      <img
        src="/icons/ai.svg"
        alt="AI-Powered Intelligence"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
    delay: 0.2,
  },
  {
    title: "Anonymous Direct Messaging",
    description:
      "Communicate safely without exposing personal information. Control when and how you share contact details.",
    icon: (
      <img
        src="/icons/message.svg"
        alt="Privacy-First Design"
        className="h-6 w-6 text-primary dark:invert"
      />
    ),
    delay: 0.3,
  },
  {
    title: "Verified Professional Network",
    description:
      "Every profile is verified and authentic. Build relationships with confidence knowing everyone is who they say they are.",
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    delay: 0.4,
  },
  {
    title: "Smart Scheduling",
    description:
      "Seamlessly coordinate interviews with integrated calendar sync. Never miss an opportunity with automated reminders and intelligent scheduling.",
    icon: <Calendar className="h-6 w-6 text-primary" />,
    delay: 0.5,
  },
]

export default function Features() {
  return (
    <section className="relative isolate overflow-hidden bg-background px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
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

        <motion.div
          className="-mt-12 -ml-12 p-12 lg:sticky lg:top-12 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="w-3xl max-w-none sm:w-228">
            <img
              src="/images/feature-image.png"
              alt="Dashboard Preview"
              className="w-full h-auto border-2 rounded-lg sm:rounded-[3.5rem] object-cover"
            /> 
          </div>
        </motion.div>

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
                Swrk™ revolutionizes how talent and opportunity connect. By
                combining mutual intent matching with AI-powered insights, we
                eliminate the friction from every stage of the hiring process.
              </p>

              <ul role="list" className="space-y-6">
                {features.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex gap-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: feature.delay }}
                    viewport={{ once: true }}
                  >
                    <div className="flex-none">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm">{feature.description}</p>
                    </div>
                  </motion.li>
                ))}
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
