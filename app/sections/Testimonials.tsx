"use client"

import { Users } from "lucide-react"
import Image from "next/image"
import CountUp from "react-countup"

const testimonials = [
  {
    content:
      "Swrk completely changed how I approach job hunting. Instead of endless applications into the void, I only connect with companies that are genuinely interested. Found my perfect role in just two weeks!",
    name: "Alex Chen",
    handle: "@alexchen_dev",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  },
  {
    content:
      "As a startup founder, finding the right talent is everything. Swrk's AI matching and mutual intent system cut our hiring time by 70%. We've built an incredible team thanks to this platform.",
    name: "Sarah Johnson",
    handle: "@sarahj_founder",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
  {
    content:
      "The verified profiles give me peace of mind. No more worrying about fake applications or unqualified candidates. Every match feels legitimate and promising.",
    name: "Michael Rodriguez",
    handle: "@mike_techlead",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
  },
  {
    content:
      "Swrk has revolutionized recruitment. The mutual intent model ensures both parties are committed before investing time in conversations.",
    name: "Emma Thompson",
    handle: "@emma_hr_pro",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
  },
  {
    content:
      "I love how Swrk learns from my preferences. The AI gets better at suggesting matches that actually align with my career goals and company culture.",
    name: "David Kim",
    handle: "@davidk_engineer",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  },
  {
    content:
      "Finally, a job platform that respects everyone's time. No more cold outreach, just meaningful connections.",
    name: "Lisa Park",
    handle: "@lisa_designer",
    avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
  },
  {
    content:
      "The anonymous direct messaging is brilliant. We can have real conversations without exchanging personal contact info until we're both ready to move forward.",
    name: "James Wilson",
    handle: "@james_ceo",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704b",
  },
  {
    content:
      "Swrk's smart scheduling integration makes coordinating interviews effortless. Everything syncs with my calendar automatically.",
    name: "Rachel Green",
    handle: "@rachel_recruit",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704c",
  },
  {
    content:
      "I've tried every job platform out there, but Swrk is the only one that truly understands what both job seekers and employers need. It's a game changer.",
    name: "Tom Anderson",
    handle: "@tom_productmgr",
    avatar: "https://i.pravatar.cc/150?u=a04258a2462d8267123",
  },
]

export default function Testimonials() {
  return (
    <section id="trusted-by" className="relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Loved by professionals worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              Don&apos;t take our word for it - listen to what{" "}
              <br className="hidden md:block" />
              Swrk users have to say about their experience.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                <CountUp
                  end={50000}
                  suffix="+"
                  autoAnimate
                  autoAnimateOnce
                  duration={5}
                />
              </div>
              <div className="flex items-center text-muted-foreground gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>Active Users</span>
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                <CountUp
                  end={100000}
                  suffix="+"
                  autoAnimate
                  autoAnimateOnce
                  duration={5}
                />
              </div>
              <div className="text-muted-foreground text-sm font-medium">
                Successful Matches
              </div>
            </div>
          </div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="break-inside-avoid bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all dark:hover:bg-primary/10 duration-300"
            >
              <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
                {testimonial.content}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {testimonial.handle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
