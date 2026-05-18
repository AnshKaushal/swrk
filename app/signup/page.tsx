"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import type { SignInResponse } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "sonner"
import { BrandLogo } from "@/components/brand-logo"

type Step = "email" | "otp" | "password"

export default function SignupPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpToken, setOtpToken] = useState("")
  const router = useRouter()

  const waitForSession = async (attempts = 12, interval = 300) => {
    for (let i = 0; i < attempts; i++) {
      const s = await getSession()
      if (s && s.user) return s
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, interval))
    }
    return null
  }

  const sendOtp = async () => {
    if (!email.trim()) {
      toast.error("Please enter a valid email")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep("otp")
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP")
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    setLoading(true)
    try {
      const fetchRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await fetchRes.json()
      if (!fetchRes.ok) throw new Error(data.error)
      setOtpToken(data.otpLoginToken)
      if (data.hasPassword) {
        try {
          const signInRes = (await signIn("otp", {
            email,
            otpToken: data.otpLoginToken,
            redirect: false,
          } as any)) as SignInResponse | undefined
          if (signInRes?.ok) {
            const s = await waitForSession()
            if (s) {
              router.push("/onboarding")
            } else {
              toast.error("Sign in succeeded but session not available yet")
            }
          } else {
            toast.error(signInRes?.error || "OTP sign in failed")
          }
        } catch (error: any) {
          toast.error(error?.message || "OTP sign in failed")
        }
      } else {
        setStep("password")
      }
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed")
    }
    setLoading(false)
  }

  const setPasswordAndSignIn = async () => {
    setLoading(true)
    try {
      const fetchRes = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      })
      const data = await fetchRes.json()
      if (!fetchRes.ok) throw new Error(data.error)
      try {
        const signInRes = (await signIn("credentials", {
          email,
          password,
          redirect: false,
        } as any)) as SignInResponse | undefined
        if (signInRes?.ok) {
          const s = await waitForSession()
          if (s) {
            router.push("/onboarding")
          } else {
            toast.error("Sign in succeeded but session not available yet")
          }
        } else {
          toast.error(
            signInRes?.error || "Sign in error after account creation",
          )
        }
      } catch (error: any) {
        toast.error(error?.message || "Sign in error after account creation")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    }
    setLoading(false)
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/onboarding" })
  }

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Get Started"
      case "otp":
        return "Verify Your Email"
      case "password":
        return "Complete Your Account"
      default:
        return "Get Started"
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Enter your email to create your Mutch account"
      case "otp":
        return "We've sent a verification code to your email"
      case "password":
        return "Set up your password to secure your account"
      default:
        return "Enter your email to create your Mutch account"
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=80"
          alt="Welcome to Mutch"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <BrandLogo className="h-12 w-12 md:h-12 md:w-[174px]" alt="Mutch" />
          </Link>
          <div className="space-y-4">
            <h2 className="text-5xl leading-tight font-black tracking-tighter">
              Start Your <br /> Professional Journey.
            </h2>
            <p className="max-w-md text-xl font-medium text-white/80">
              Join thousands of professionals building meaningful connections
              and advancing their careers.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold tracking-widest text-white/60 uppercase">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black tracking-normal text-white">
                10k+
              </span>
              <span>Professionals</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black tracking-normal text-white">
                99%
              </span>
              <span>Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md animate-in space-y-8 duration-700 fade-in slide-in-from-right">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">
              {getStepTitle()}
            </h1>
            <p className="font-medium text-muted-foreground">
              {getStepDescription()}
            </p>
            {step !== "email" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Step {step === "otp" ? "2" : "3"} of 3</span>
                <div className="flex gap-1">
                  <div className="h-2 w-8 rounded-full bg-primary" />
                  <div
                    className={`h-2 w-8 rounded-full ${step === "otp" || step === "password" ? "bg-primary" : "bg-muted"}`}
                  />
                  <div
                    className={`h-2 w-8 rounded-full ${step === "password" ? "bg-primary" : "bg-muted"}`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {step === "email" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 rounded-full px-4"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  onClick={sendOtp}
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Continue"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 font-bold text-muted-foreground">
                      Or sign up with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 border-muted-foreground/20 hover:bg-muted"
                  onClick={handleGoogleSignIn}
                  disabled={true || loading}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="h-10 border-none bg-muted/50 px-4 text-center text-lg tracking-widest"
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button
                  onClick={verifyOtp}
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep("email")}
                  className="w-full"
                  disabled={loading}
                >
                  Back
                </Button>
              </>
            )}

            {step === "password" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 border-none bg-muted/50 px-4"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 border-none bg-muted/50 px-4"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  onClick={setPasswordAndSignIn}
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep("otp")}
                  className="w-full"
                  disabled={loading}
                >
                  Back
                </Button>
              </>
            )}
          </div>

          {step === "email" && (
            <p className="text-center text-sm font-medium text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => router.push("/signin")}
                className="px-1 text-primary hover:underline"
              >
                Sign in
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
