"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { toast } from "sonner"

export default function SigninPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.ok) {
        toast.success("Welcome back!")
        router.push("/dashboard")
      } else {
        toast.error("Invalid email or password")
      }
    } catch (err: any) {
      toast.error("Sign in failed")
    }
    setLoading(false)
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Welcome back"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <img src="/swrk.svg" alt="Swrk™" className="h-12 w-fit" />
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 font-bold text-muted-foreground">
                Or connect with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full gap-3 border-muted-foreground/20 hover:bg-muted"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign In With Google
          </Button>

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
