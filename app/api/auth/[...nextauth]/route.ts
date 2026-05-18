import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        try {
          await db()
          const input = (credentials?.email as string)?.toLowerCase()?.trim()

          if (!input || !credentials?.password) {
            console.error("Missing credentials")
            return null
          }

          const user = await User.findOne({
            $or: [{ email: input }, { username: input }],
          })

          if (!user) {
            console.error("User not found:", input)
            return null
          }

          if (!user.isVerified) {
            console.error("User not verified:", user._id)
            return null
          }

          if (user.isBanned) {
            console.error("User banned:", user._id)
            return null
          }

          if (!user.password) {
            console.error("User has no password:", user._id)
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          )

          if (!isValid) {
            console.error("Invalid password for user:", user._id)
            return null
          }

          console.log("User authenticated successfully:", user._id)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.avatar,
            role: user.isAdmin ? "admin" : user.role,
            onboardingStep: user.onboardingStep,
            onboardingCompleted: user.onboardingCompleted,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
          }
        } catch (error: any) {
          console.error("Credentials authorize error:", error)
          return null
        }
      },
    }),

    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials: any) {
        try {
          await db()
          const user = await User.findOne({
            email: (credentials?.email as string)?.toLowerCase()?.trim(),
          })

          if (!user) {
            console.error("User not found for OTP:", credentials?.email)
            return null
          }

          if (user.isBanned) {
            console.error("User banned:", user._id)
            return null
          }

          if (
            !user.otpLoginToken ||
            user.otpLoginToken !== credentials?.otpToken ||
            !user.otpLoginTokenExpiry ||
            user.otpLoginTokenExpiry < new Date()
          ) {
            console.error("Invalid or expired OTP token for user:", user._id)
            return null
          }

          await User.findByIdAndUpdate(user._id, {
            $unset: { otpLoginToken: "", otpLoginTokenExpiry: "" },
          })

          console.log("User authenticated via OTP:", user._id)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            image: user.avatar,
            role: user.isAdmin ? "admin" : user.role,
            onboardingStep: user.onboardingStep,
            onboardingCompleted: user.onboardingCompleted,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
          }
        } catch (error: any) {
          console.error("OTP authorize error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({
      user,
      account,
      credentials,
    }: {
      user: any
      account?: any
      credentials?: any
    }) {
      try {
        if (!user || !user.id) {
          console.error("No user in signIn callback")
          return false
        }

        await db()

        if (account?.provider === "google") {
          const existingUser = await User.findOneAndUpdate(
            { email: user.email.toLowerCase() },
            {
              $set: {
                name: user.name,
                avatar: user.image,
                authProvider: "google",
                oauthId: account.providerAccountId,
                isVerified: true,
                lastSeen: new Date(),
              },
              $setOnInsert: {
                email: user.email.toLowerCase(),
                onboardingStep: 1,
                onboardingCompleted: false,
                role: null,
              },
            },
            { upsert: true, returnDocument: "after" },
          )

          user.id = existingUser._id.toString()
          user.role = existingUser.isAdmin ? "admin" : existingUser.role
          user.username = existingUser.username
          user.onboardingStep = existingUser.onboardingStep
          user.onboardingCompleted = existingUser.onboardingCompleted
          user.isAdmin = existingUser.isAdmin
          user.isVerified = existingUser.isVerified
        } else if (credentials) {
          const loggedInUser = await User.findByIdAndUpdate(
            user.id,
            { lastSeen: new Date() },
            { returnDocument: "after" },
          )
          if (!loggedInUser) {
            console.error("User not found in database:", user.id)
            return false
          }
          user.isVerified = loggedInUser.isVerified
        }

        return true
      } catch (error) {
        console.error("signIn callback error:", error)
        return false
      }
    },

    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: any
      user?: any
      trigger?: string
      session?: any
    }) {
      if (user) {
        token.id = user.id
        token.role = user.isAdmin ? "admin" : user.role
        token.username = user.username
        token.onboardingStep = user.onboardingStep
        token.onboardingCompleted = user.onboardingCompleted
        token.isAdmin = user.isAdmin
        token.isVerified = user.isVerified
        token.picture = user.image || user.avatar || token.picture
      }

      if (trigger === "update" && session) {
        if (session.onboardingStep !== undefined)
          token.onboardingStep = session.onboardingStep
        if (session.onboardingCompleted !== undefined)
          token.onboardingCompleted = session.onboardingCompleted
        if (session.role !== undefined) token.role = session.role
        if (session.name !== undefined) token.name = session.name
        if (session.username !== undefined) token.username = session.username
        if (session.image !== undefined) token.picture = session.image
        if (session.avatar !== undefined) token.picture = session.avatar
        if (session.isVerified !== undefined)
          token.isVerified = session.isVerified
      }

      return token
    },

    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id
      session.user.role = token.isAdmin ? "admin" : token.role
      session.user.username = token.username
      session.user.onboardingStep = token.onboardingStep
      session.user.onboardingCompleted = token.onboardingCompleted
      session.user.isAdmin = token.isAdmin
      session.user.isVerified = token.isVerified
      session.user.avatar = token.picture || null
      return session
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_SECRET ? "next-auth.session-token" : "next-auth-dev.session-token"}`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      },
    },
  },

  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth } = NextAuth(authOptions)
export const { GET, POST } = handlers
