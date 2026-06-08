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
        return "Enter your email to create your Swrk account"
      case "otp":
        return "We've sent a verification code to your email"
      case "password":
        return "Set up your password to secure your account"
      default:
        return "Enter your email to create your Swrk account"
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=80"
          alt="Welcome to Swrk"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <BrandLogo className="h-12 w-12 md:h-12 md:w-[174px]" alt="Swrk" />
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
