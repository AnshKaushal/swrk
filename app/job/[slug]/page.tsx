import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import { PublicJobView } from "./public-job-view"

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await db()
  const { slug } = await params

  const position = await Position.findOne({ slug, status: "active", isVisible: true })
    .populate("employerId", "name avatar companyName")
    .lean()

  if (!position) {
    notFound()
  }

  const serialized = JSON.parse(JSON.stringify(position))

  return <PublicJobView position={serialized} />
}
