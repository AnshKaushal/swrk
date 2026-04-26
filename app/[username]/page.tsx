import { notFound } from "next/navigation"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  await db()
  const user = await User.findOne({ username: username })

  if (!user) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-gray-600">@{user.username}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Role</h3>
              <Badge
                variant={user.role === "employer" ? "default" : "secondary"}
              >
                {user.role === "employer"
                  ? "Hiring"
                  : user.role === "employee"
                    ? "Looking for job"
                    : "Both"}
              </Badge>
            </div>
            {user.phone && (
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p>{user.phone}</p>
              </div>
            )}
            {user.dateOfBirth && (
              <div>
                <h3 className="font-semibold">Date of Birth</h3>
                <p>{new Date(user.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {user.gender && (
              <div>
                <h3 className="font-semibold">Gender</h3>
                <p>{user.gender}</p>
              </div>
            )}
            {user.linkedinUrl && (
              <div>
                <h3 className="font-semibold">LinkedIn</h3>
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  {user.linkedinUrl}
                </a>
              </div>
            )}
            {user.githubUrl && (
              <div>
                <h3 className="font-semibold">GitHub</h3>
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  {user.githubUrl}
                </a>
              </div>
            )}
            {user.portfolioUrl && (
              <div>
                <h3 className="font-semibold">Portfolio</h3>
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  {user.portfolioUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
