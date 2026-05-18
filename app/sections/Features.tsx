"use client"
import { Activity, Map as MapIcon, MessageCircle } from "lucide-react"
import DottedMap from "dotted-map"
import { Area, AreaChart, CartesianGrid } from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export default function Features() {
  return (
    <section
      id="how-it-works"
      className="py-16 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="grid border md:grid-cols-2 rounded-4xl overflow-hidden">
        <div>
          <div className="p-6 sm:p-8 lg:p-10">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapIcon className="size-4" />
              Smart Matching
            </span>

            <p className="mt-6 sm:mt-8 text-xl sm:text-2xl font-semibold">
              AI-powered matching connects you with the right opportunities.
            </p>
          </div>

          <div aria-hidden className="relative px-6 sm:px-8 lg:px-10">
            <div className="absolute inset-0 z-10 m-auto size-fit">
              <div className="rounded-[--radius] bg-background z-[1] dark:bg-muted relative flex size-fit w-fit items-center gap-2 border px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                <span className="text-lg">✨</span> 1,000+ matches this month
              </div>
              <div className="rounded-[--radius] bg-background absolute inset-2 -bottom-2 mx-auto border px-3 py-4 text-xs font-medium shadow-md shadow-black/5 dark:bg-zinc-900"></div>
            </div>

            <div className="relative overflow-hidden">
              <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 to-background absolute inset-0 from-transparent to-75%"></div>
              <Map />
            </div>
          </div>
        </div>
        <div className="overflow-hidden border-t bg-zinc-50 p-6 sm:p-8 lg:p-10 md:border-0 md:border-l dark:bg-card">
          <div className="relative z-10">
            <span className="text-muted-foreground flex items-center gap-2">
              <MessageCircle className="size-4" />
              Direct Messaging
            </span>

            <p className="my-6 sm:my-8 text-xl sm:text-2xl font-semibold">
              Connect instantly with potential employers or candidates.
            </p>
          </div>
          <div aria-hidden className="flex flex-col gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex justify-center items-center size-5 rounded-full border">
                  <span className="size-3 rounded-full bg-primary" />
                </span>
                <span className="text-muted-foreground text-xs">Today</span>
              </div>
              <div className="rounded-[var(--radius)] bg-background mt-1.5 w-3/5 border p-3 text-xs">
                Great profile! Interested in our opening?
              </div>
            </div>

            <div>
              <div className="rounded-[var(--radius)] mb-1 ml-auto w-3/5 dark:bg-primary bg-primary p-3 text-xs text-background">
                Yes, I'd love to learn more about the position.
              </div>
              <span className="text-muted-foreground block text-right text-xs">
                Now
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-full border-y p-8 sm:p-10 lg:p-12">
          <p className="text-center text-3xl sm:text-4xl lg:text-6xl font-semibold">
            95% Success Rate
          </p>
        </div>
        <div className="relative col-span-full">
          <div className="absolute z-10 max-w-lg px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
            <span className="text-muted-foreground flex items-center gap-2">
              <Activity className="size-4" />
              Your Dashboard
            </span>

            <p className="my-6 sm:my-8 text-xl sm:text-2xl font-semibold">
              Track your matches and opportunities in real-time.{" "}
              <span className="text-muted-foreground">
                {" "}
                Manage your professional journey.
              </span>
            </p>
          </div>
          <MonitoringChart />
        </div>
      </div>
    </section>
  )
}

const map = new DottedMap({ height: 55, grid: "diagonal" })

const points = map.getPoints()

const svgOptions = {
  backgroundColor: "var(--color-background)",
  color: "currentColor",
  radius: 0.15,
}

const Map = () => {
  const viewBox = `0 0 120 60`
  return (
    <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }}>
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={svgOptions.radius}
          fill={svgOptions.color}
        />
      ))}
    </svg>
  )
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

const chartData = [
  { month: "May", desktop: 56, mobile: 224 },
  { month: "June", desktop: 56, mobile: 224 },
  { month: "January", desktop: 126, mobile: 252 },
  { month: "February", desktop: 205, mobile: 410 },
  { month: "March", desktop: 200, mobile: 126 },
  { month: "April", desktop: 400, mobile: 800 },
]

const MonitoringChart = () => {
  return (
    <ChartContainer className="h-120 aspect-auto md:h-96" config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 0,
        }}
      >
        <defs>
          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.8}
            />
            <stop
              offset="55%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-mobile)"
              stopOpacity={0.8}
            />
            <stop
              offset="55%"
              stopColor="var(--color-mobile)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <ChartTooltip
          active
          cursor={false}
          content={<ChartTooltipContent className="dark:bg-muted" />}
        />
        <Area
          strokeWidth={2}
          dataKey="mobile"
          type="stepBefore"
          fill="url(#fillMobile)"
          fillOpacity={0.1}
          stroke="var(--color-mobile)"
          stackId="a"
        />
        <Area
          strokeWidth={2}
          dataKey="desktop"
          type="stepBefore"
          fill="url(#fillDesktop)"
          fillOpacity={0.1}
          stroke="var(--color-desktop)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
