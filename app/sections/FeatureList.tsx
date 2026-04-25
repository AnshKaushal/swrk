"use client"
import { Carousel, Card } from "@/components/ui/apple-cards-carousel"
import { motion } from "framer-motion"

const FeatureContent = ({
  title,
  description,
}: {
  title: string
  description: string
}) => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          {title}
        </span>{" "}
        {description}
      </p>
      <img
        src="https://assets.aceternity.com/macbook.png"
        alt="Swrk interface mockup"
        height="500"
        width="500"
        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
      />
    </div>
  )
}

const data = [
  {
    category: "Matching",
    title: "Mutual Intent Matching",
    src: "https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="No More Black Holes."
        description="Say goodbye to one-way applications. On Swrk, conversations only begin when both the employer and candidate have expressed genuine interest. This mutual intent model eliminates wasted time and creates meaningful connections from the start."
      />
    ),
  },
  {
    category: "Intelligence",
    title: "AI-Powered Recommendations",
    src: "https://images.unsplash.com/photo-1727773458292-9da4284a4d3e?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="Beyond Keywords."
        description="Our AI engine learns from your interactions to understand the deeper patterns of what makes a great fit. It analyzes company culture, growth potential, and career alignment—not just job titles. Every suggestion becomes smarter over time."
      />
    ),
  },
  {
    category: "Verification",
    title: "Verified Professional Network",
    src: "https://images.unsplash.com/photo-1759310610372-c547611af808?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="Trust by Default."
        description="Every profile on Swrk is verified and authentic. We've eliminated fake accounts and scams so you can focus on what matters—finding the right opportunity or the right talent. Trust isn't earned; it's built into the platform."
      />
    ),
  },
  {
    category: "Privacy",
    title: "Anonymous Direct Messaging",
    src: "https://images.unsplash.com/photo-1619658535018-5a55d32e4628?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="Privacy First."
        description="Communicate directly without exposing personal contact information. Our built-in messaging keeps you safe until you're ready to exchange details. Control when and how you reveal your information."
      />
    ),
  },
  {
    category: "Career",
    title: "Growth & Development Tools",
    src: "https://images.unsplash.com/photo-1603969280040-3bbb77278211?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="Your Growth Matters."
        description="Access analytics, interview preparation resources, and career coaching from industry leaders. Track your progress, understand employer insights, and continuously improve. Swrk supports your entire career journey."
      />
    ),
  },
  {
    category: "Hiring",
    title: "Employer Recruitment Suite",
    src: "https://images.unsplash.com/photo-1511376979163-f804dff7ad7b?w=900&auto=format&fit=crop&q=80",
    content: (
      <FeatureContent
        title="Hire with Confidence."
        description="Post unlimited openings, access a curated pool of qualified candidates, and use advanced analytics to optimize your hiring. Smart scheduling integration makes the entire process seamless—from first swipe to offer letter."
      />
    ),
  },
]

export default function FeatureList() {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ))

  return (
    <div className="w-full h-full py-12 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
          Explore Swrk's Features
        </h2>
        <p className="text-lg text-muted-foreground">
          We cut through the noise. A meticulously crafted ecosystem for
          employers and professionals who value time over endless browsing.
        </p>
      </motion.div>
      <Carousel items={cards} />
    </div>
  )
}
