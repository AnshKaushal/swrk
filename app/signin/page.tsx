"use client"

import { useState, useEffect, Suspense } from "react"
import { getSession } from "next-auth/react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "sonner"
import { BrandLogo } from "@/components/brand-logo"

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email/username or password",
  Default: "Something went wrong during sign in",
}

function SigninForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams?.get("error") ?? ""
    if (error) {
      const message = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default
      toast.error(message)
    }
  }, [searchParams])

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter email/username and password")
      return
    }
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("SignIn result:", result)

      if (result?.error) {
        const message = ERROR_MESSAGES[result.error] || "Invalid credentials"
        toast.error(message)
      } else if (result?.ok && !result?.error) {
        toast.success("Welcome back!")

        // Poll getSession briefly to ensure NextAuth session is established
        let sess: any = null
        for (let i = 0; i < 6; i++) {
          // eslint-disable-next-line no-await-in-loop
          sess = await getSession()
          if (sess?.user) break
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 500))
        }

        const onboardingCompleted = Boolean(sess?.user?.onboardingCompleted)

        if (!onboardingCompleted) {
          router.push("/onboarding")
        } else {
          router.push("/dashboard")
        }

        router.refresh()
      } else {
        toast.error("Invalid credentials")
      }
    } catch (err: any) {
      console.error("Sign in error:", err)
      toast.error("Sign in failed")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2564&auto=format&fit=crop"
          alt="Welcome back"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <BrandLogo className="h-12 w-12 md:h-12 md:w-[174px]" alt="Swrk" />
          </Link>
          <div className="space-y-4">
            <h2 className="text-5xl leading-tight font-black tracking-tighter">
              Continue Your <br /> Professional Journey.
            </h2>
            <p className="max-w-md text-xl font-medium text-white/80">
              Sign in to access your matches and continue building your career
              network.
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
                95%
              </span>
              <span>Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md animate-in space-y-8 duration-700 fade-in slide-in-from-right">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">Welcome Back</h1>
            <p className="font-medium text-muted-foreground">
              Sign in to your Swrk account
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="john@example.com or johndoe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 border-none bg-muted/50 px-4"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
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
              onClick={handleSignIn}
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>

          <p className="text-center text-sm font-medium text-muted-foreground">
            New here?{" "}
            <Button
              variant="link"
              onClick={() => router.push("/signup")}
              className="px-1 text-primary hover:underline"
            >
              Create your account
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SigninPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninForm />
    </Suspense>
  )
}
