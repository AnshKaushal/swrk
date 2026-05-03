import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      name?: string | null
      email?: string | null
      avatar?: string | null
      username?: string | null
      role?: string | null
      onboardingStep?: number
      onboardingCompleted?: boolean
      isAdmin?: boolean
      isVerified?: boolean
    }
  }

  interface User extends DefaultUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
    role?: string | null
    onboardingStep?: number
    onboardingCompleted?: boolean
    isAdmin?: boolean
    isVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name?: string | null
    email?: string | null
    picture?: string | null
    username?: string | null
    role?: string | null
    onboardingStep?: number
    onboardingCompleted?: boolean
    isAdmin?: boolean
    isVerified?: boolean
  }
}
