"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "sonner"
import { BrandLogo } from "@/components/brand-logo"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else {
        toast.error(data.error || "Failed to submit inquiry")
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2564&auto=format&fit=crop"
          alt="Contact us"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <BrandLogo className="h-12 w-12 md:h-12 md:w-[174px]" alt="Mutch" />
          </Link>
          <div className="space-y-4">
            <h2 className="text-5xl leading-tight font-black tracking-tighter">
              Let's Get <br /> In Touch.
            </h2>
            <p className="max-w-md text-xl font-medium text-white/80">
              Have a question or feedback? We'd love to hear from you. Drop us a
              line and we'll respond as soon as possible.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold tracking-widest text-white/60 uppercase">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black tracking-normal text-white">
                24hrs
              </span>
              <span>Response Time</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black tracking-normal text-white">
                100%
              </span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md animate-in space-y-8 duration-700 fade-in slide-in-from-right">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">Get In Touch</h1>
            <p className="font-medium text-muted-foreground">
              We're here to help. Send us your inquiry.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="What is this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-10 border-none bg-muted/50 px-4"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="min-h-32 border-none bg-muted/50 px-4 py-2 resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-muted-foreground">
            Need something specific?{" "}
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="px-1 text-primary hover:underline"
            >
              Go back home
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
