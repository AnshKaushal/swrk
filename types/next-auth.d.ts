import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      role?: string | null
      onboardingStep?: number
      onboardingCompleted?: boolean
      isAdmin?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
    role?: string | null
    onboardingStep?: number
    onboardingCompleted?: boolean
    isAdmin?: boolean
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
  }
}
