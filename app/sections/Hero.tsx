"use client"
import * as React from "react"
import { useTheme } from "next-themes"
import {
  FloatingIconsHero,
  type FloatingIconsHeroProps,
} from "@/components/floating-icons"
import { useSession } from "next-auth/react"

const IconGoogle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.9999 12.24C21.9999 11.4933 21.9333 10.76 21.8066 10.0533H12.3333V14.16H17.9533C17.7333 15.3467 17.0133 16.3733 15.9666 17.08V19.68H19.5266C21.1933 18.16 21.9999 15.4533 21.9999 12.24Z"
      fill="#4285F4"
    />
    <path
      d="M12.3333 22C15.2333 22 17.6866 21.0533 19.5266 19.68L15.9666 17.08C15.0199 17.7333 13.7933 18.16 12.3333 18.16C9.52659 18.16 7.14659 16.28 6.27992 13.84H2.59326V16.5133C4.38659 20.0267 8.05992 22 12.3333 22Z"
      fill="#34A853"
    />
    <path
      d="M6.2799 13.84C6.07324 13.2267 5.9599 12.58 5.9599 11.92C5.9599 11.26 6.07324 10.6133 6.2799 10L2.59326 7.32667C1.86659 8.78667 1.45326 10.32 1.45326 11.92C1.45326 13.52 1.86659 15.0533 2.59326 16.5133L6.2799 13.84Z"
      fill="#FBBC05"
    />
    <path
      d="M12.3333 5.68C13.8933 5.68 15.3133 6.22667 16.3866 7.24L19.6 4.02667C17.68 2.29333 15.2266 1.33333 12.3333 1.33333C8.05992 1.33333 4.38659 3.97333 2.59326 7.32667L6.27992 10C7.14659 7.56 9.52659 5.68 12.3333 5.68Z"
      fill="#EA4335"
    />
  </svg>
)

const IconApple = (props: React.SVGProps<SVGSVGElement>) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const shouldInvert = mounted && theme === "light"

  return (
    <svg
      {...props}
      role="img"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: shouldInvert ? "invert(1)" : undefined }}
    >
      <title>Apple</title>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

const IconMicrosoft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.4 2H2v9.4h9.4V2Z" fill="#F25022" />
    <path d="M22 2h-9.4v9.4H22V2Z" fill="#7FBA00" />
    <path d="M11.4 12.6H2V22h9.4V12.6Z" fill="#00A4EF" />
    <path d="M22 12.6h-9.4V22H22V12.6Z" fill="#FFB900" />
  </svg>
)

const IconWipro = (props: React.SVGProps<SVGSVGElement>) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const shouldInvert = mounted && theme === "light"

  return (
    <img
      src="/logos/wipro.png"
      alt="wipro"
      style={{ filter: shouldInvert ? "invert(1)" : undefined }}
    />
  )
}

const IconInfosys = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/infosys.png" alt="infosys" />
)

const IconTesla = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    height={48}
    width={48}
    fill="#E82127"
    viewBox="0 0 122.88 122.36"
    xmlSpace="preserve"
  >
    <style type="text/css"></style>
    <g>
      <path
        className="st0"
        d="M61.45,122.36l17.19-96.68c16.39,0,21.55,1.8,22.3,9.13c0,0,10.99-4.1,16.54-12.42 C95.84,12.36,74.1,11.91,74.1,11.91L61.42,27.35l0.03,0L48.76,11.9c0,0-21.74,0.45-43.37,10.48C10.93,30.7,21.93,34.8,21.93,34.8 c0.75-7.33,5.91-9.13,22.19-9.14L61.45,122.36L61.45,122.36L61.45,122.36z M61.45,122.36L61.45,122.36L61.45,122.36L61.45,122.36z M61.44,7.44c17.49-0.13,37.51,2.71,58,11.64c2.74-4.93,3.44-7.11,3.44-7.11C100.48,3.11,79.5,0.08,61.44,0 C43.37,0.08,22.4,3.11,0,11.97c0,0,1,2.68,3.44,7.11C23.93,10.15,43.95,7.31,61.44,7.44L61.44,7.44L61.44,7.44z"
      />
    </g>
  </svg>
)

const IconTCS = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/tcs.svg" alt="tcs" width={36} height={36} />
)

// --- New Unique SVG Icons ---
const IconCognizant = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/cognizant.svg" alt="cognizant" />
)

const IconHCL = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/hcl.svg" alt="hcl" />
)

const IconCostco = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/costco.svg" alt="costco" height={32} width={32} />
)

const IconBerkshire = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/berkshire.svg" alt="berkshire" />
)

const IconJPMorgan = (props: React.SVGProps<SVGSVGElement>) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const shouldInvert = mounted && theme === "light"

  return (
    <img
      src="/logos/jpm.svg"
      alt="jpm"
      style={{ filter: shouldInvert ? "invert(1)" : undefined }}
    />
  )
}

const IconExxon = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/exxon.svg" alt="exxon" />
)

const IconDeloitte = (props: React.SVGProps<SVGSVGElement>) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const shouldInvert = mounted && theme === "light"

  return (
    <img
      src="/logos/deloitte.svg"
      alt="deloitte"
      height={36}
      width={36}
      style={{ filter: shouldInvert ? "invert(1)" : undefined }}
    />
  )
}

const IconAccenture = (props: React.SVGProps<SVGSVGElement>) => (
  <img src="/logos/accenture.svg" alt="accenture" height={32} width={32} />
)

const IconEY = (props: React.SVGProps<SVGSVGElement>) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const shouldInvert = mounted && theme === "light"

  return (
    <img
      src="/logos/ey.svg"
      alt="ey"
      height={32}
      width={32}
      style={{ filter: shouldInvert ? "invert(1)" : undefined }}
    />
  )
}

const icons: FloatingIconsHeroProps["icons"] = [
  { id: 1, icon: IconGoogle, className: "top-[10%] left-[10%]" },
  { id: 2, icon: IconApple, className: "top-[20%] right-[8%]" },
  { id: 3, icon: IconMicrosoft, className: "top-[80%] left-[10%]" },
  { id: 4, icon: IconWipro, className: "bottom-[10%] right-[10%]" },
  { id: 5, icon: IconInfosys, className: "top-[5%] left-[30%]" },
  { id: 6, icon: IconTesla, className: "top-[5%] right-[30%]" },
  { id: 7, icon: IconCognizant, className: "bottom-[8%] left-[25%]" },
  { id: 8, icon: IconHCL, className: "top-[40%] left-[15%]" },
  { id: 9, icon: IconCostco, className: "top-[75%] right-[25%]" },
  { id: 10, icon: IconBerkshire, className: "top-[90%] left-[70%]" },
  { id: 11, icon: IconTCS, className: "top-[50%] right-[5%]" },
  { id: 12, icon: IconJPMorgan, className: "top-[55%] left-[5%]" },
  { id: 13, icon: IconExxon, className: "top-[5%] left-[55%]" },
  { id: 14, icon: IconDeloitte, className: "bottom-[5%] right-[45%]" },
  { id: 15, icon: IconAccenture, className: "top-[25%] right-[20%]" },
  { id: 16, icon: IconEY, className: "top-[60%] left-[30%]" },
]

export default function Hero() {
  const { data: session, status } = useSession()

  if (status === "loading")
    return (
      <FloatingIconsHero
        title="Swipe. Match. Hire."
        subtitle="Stop hunting, start matching. Swrk™ brings the speed of discovery to the professional world. Swipe, match, and connect with your next opportunity in seconds."
        ctaText="Loading..."
        ctaHref="/"
        ctaText2="Learn More"
        ctaHref2="#features"
        icons={icons}
      />
    )

  return (
    <FloatingIconsHero
      title="Swipe. Match. Hire."
      subtitle="Stop hunting, start matching. Swrk™ brings the speed of discovery to the professional world. Swipe, match, and connect with your next opportunity in seconds."
      ctaText={session ? "Go to Dashboard" : "Join the revolution"}
      ctaHref={session ? "/dashboard" : "/signup"}
      ctaText2="Learn More"
      ctaHref2="#features"
      icons={icons}
    />
  )
}
