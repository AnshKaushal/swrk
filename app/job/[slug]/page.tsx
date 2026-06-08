import { notFound } from "next/navigation"
import mongoose from "mongoose"
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

  const position = await Position.findOne({ slug, status: "active", isVisible: true }).lean()

  if (!position) {
    notFound()
  }

  // Manual lookup to avoid Mongoose populate issues with model registration
  if (position.employerId) {
    const oid =
      typeof position.employerId === "object" && "_id" in position.employerId
        ? (position.employerId as any)._id
        : position.employerId
    const employer = await mongoose.connection
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(String(oid)) })
    position.employerId = employer
      ? {
          _id: String(employer._id),
          name: employer.name,
          avatar: employer.avatar,
          companyName: employer.companyName,
        }
      : position.employerId
  }

  const serialized = JSON.parse(JSON.stringify(position))

  return <PublicJobView position={serialized} />
}
