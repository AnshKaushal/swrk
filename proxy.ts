import { auth } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"

const protectedRoutes = [
  "/dashboard",
  "/swipe",
  "/matches",
  "/profile",
  "/settings",
]
const authRoutes = ["/signin", "/signup"]

export default auth((req) => {
  const { nextUrl, auth: token } = req
  const pathname = nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )
  const isAuthRoute = authRoutes.includes(pathname)
  const isOnboarding = pathname.startsWith("/onboarding")

  if (!isProtectedRoute && !isAuthRoute && !isOnboarding) {
    return NextResponse.next()
  }

  if (!token) {
    if (isProtectedRoute || isOnboarding) {
      return NextResponse.redirect(new URL("/signin", nextUrl))
    }
    return NextResponse.next()
  }

  const isCompleted = (token as any).onboardingCompleted === true

  if (!isCompleted) {
    if (!isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }
  } else {
    if (isAuthRoute || isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/swipe/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/signin",
    "/signup",
  ],
}
