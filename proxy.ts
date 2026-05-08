import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = [
  "/dashboard",
  "/swipe",
  "/matches",
  "/profile",
  "/settings",
]
const authRoutes = ["/signin", "/signup"]

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAuthRoute = authRoutes.includes(pathname)
  const isOnboarding = pathname.startsWith("/onboarding")

  if (!isProtectedRoute && !isAuthRoute && !isOnboarding) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token
  const onboardingCompleted = token?.onboardingCompleted === true

  if (!isLoggedIn) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/signin", nextUrl))
    }
    if (isAuthRoute) {
      return NextResponse.next()
    }
    if (isOnboarding) {
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  if (!onboardingCompleted) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }
    return NextResponse.next()
  }

  if (isAuthRoute || isOnboarding) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
}

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
