"use client"

import { motion } from "framer-motion"
import LogoLoop from "@/components/LogoLoop"

const partnerLogos = [
  { src: "/companies/aditya-birla.png", alt: "Aditya Birla" },
  { src: "/companies/aionos.png", alt: "Aionos" },
  { src: "/companies/arata.png", alt: "Arata" },
  { src: "/companies/astro-yogi.png", alt: "Astro Yogi" },
  { src: "/companies/axis-life-insurance.png", alt: "Axis Life Insurance" },
  { src: "/companies/biryani-blues.png", alt: "Biryani Blues" },
  { src: "/companies/body-shop.png", alt: "Body Shop" },
  { src: "/companies/boldfit.png", alt: "Boldfit" },
  { src: "/companies/cars24.png", alt: "Cars24" },
  { src: "/companies/ceat.png", alt: "Ceat" },
  { src: "/companies/dewars.png", alt: "Dewars" },
  { src: "/companies/happilo.png", alt: "Happilo" },
  { src: "/companies/insurance-dekho.png", alt: "Insurance Dekho" },
  { src: "/companies/itc-hotels.png", alt: "Itc Hotels" },
  { src: "/companies/libas.png", alt: "Libas" },
  { src: "/companies/licious.png", alt: "Licious" },
  { src: "/companies/minimalist.png", alt: "Minimalist" },
  { src: "/companies/mpay.png", alt: "Mpay" },
  { src: "/companies/nestle.png", alt: "Nestle" },
  { src: "/companies/o3plus.png", alt: "O3plus" },
  { src: "/companies/oriflame.png", alt: "Oriflame" },
  { src: "/companies/payments-bank.png", alt: "Payments Bank" },
  { src: "/companies/pwc.png", alt: "Pwc" },
  { src: "/companies/salty.png", alt: "Salty" },
  { src: "/companies/techmahindra.png", alt: "Techmahindra" },
  { src: "/companies/upgrad.png", alt: "Upgrad" },
  { src: "/companies/veg-nonveg.png", alt: "Veg Nonveg" },
  { src: "/companies/wow-momo.png", alt: "Wow Momo" },
  { src: "/companies/zomato.png", alt: "Zomato" },
]

export default function TrustedBy() {
  const row1 = partnerLogos.slice(0, Math.ceil(partnerLogos.length / 2))
  const row2 = partnerLogos.slice(Math.ceil(partnerLogos.length / 2))

  return (
    <section id="trusted-by" className="overflow-hidden relative z-10">
      <div className="py-16 sm:py-32">
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center max-w-2xl mx-auto mb-20 space-y-6">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4"
          >
            Trusted by the world&apos;s leading organizations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground"
          >
            <b>Hire</b> the best talent or <b>get hired</b> by the best
            companies. Swrk™ is trusted by top organizations across industries
            to connect with the right talent and opportunities.
          </motion.p>
        </div>

        <div className="space-y-10 group/loop">
          <LogoLoop
            logos={row1}
            speed={40}
            gap={100}
            logoHeight={70}
            fadeOut={true}
            pauseOnHover={true}
            className="opacity-70 group-hover/loop:opacity-100 transition-opacity duration-500"
          />
          <LogoLoop
            logos={row2}
            speed={40}
            direction="right"
            gap={100}
            logoHeight={70}
            fadeOut={true}
            pauseOnHover={true}
            className="opacity-70 group-hover/loop:opacity-100 transition-opacity duration-500"
          />
        </div>
      </div>
    </section>
  )
}
