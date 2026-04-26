import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        await db()
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase().trim(),
        })

        if (!user) throw new Error("No account found with this email")
        if (!user.isVerified) throw new Error("Please verify your email first")
        if (user.isBanned) throw new Error("This account has been suspended")
        if (!user.password)
          throw new Error("Please sign in with Google or reset your password")

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )
        if (!isValid) throw new Error("Incorrect password")

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.avatar,
          role: user.role,
          onboardingStep: user.onboardingStep,
          onboardingCompleted: user.onboardingCompleted,
          isAdmin: user.isAdmin,
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
        await db()
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase().trim(),
        })

        if (!user) throw new Error("User not found")
        if (user.isBanned) throw new Error("This account has been suspended")

        if (
          !user.otpLoginToken ||
          user.otpLoginToken !== credentials.otpToken ||
          !user.otpLoginTokenExpiry ||
          user.otpLoginTokenExpiry < new Date()
        ) {
          throw new Error("Invalid or expired login token")
        }

        await User.findByIdAndUpdate(user._id, {
          $unset: { otpLoginToken: "", otpLoginTokenExpiry: "" },
        })

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.avatar,
          role: user.role,
          onboardingStep: user.onboardingStep,
          onboardingCompleted: user.onboardingCompleted,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: { user: any; account?: any }) {
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
        user.role = existingUser.role
        user.username = existingUser.username
        user.onboardingStep = existingUser.onboardingStep
        user.onboardingCompleted = existingUser.onboardingCompleted
        user.isAdmin = existingUser.isAdmin
      }

      return true
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
        token.role = user.role
        token.username = user.username
        token.onboardingStep = user.onboardingStep
        token.onboardingCompleted = user.onboardingCompleted
        token.isAdmin = user.isAdmin
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
      }

      return token
    },

    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.username = token.username
      session.user.onboardingStep = token.onboardingStep
      session.user.onboardingCompleted = token.onboardingCompleted
      session.user.isAdmin = token.isAdmin
      return session
    },
  },

  pages: {
    signIn: "/signup",
    error: "/signup",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const { auth, handlers } = NextAuth(authOptions)
export const { GET, POST } = handlers
export { auth }
