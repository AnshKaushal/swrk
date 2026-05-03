"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight } from "lucide-react"

export default function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUnsubscribed, setIsUnsubscribed] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Invalid Link
              </h1>
              <p className="text-lg text-muted-foreground">
                The unsubscribe link is invalid or expired.
              </p>
            </div>
            <Link href="/">
              <Button className="w-full group">
                Back to Home
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const handleUnsubscribe = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/newsletter/unsubscribe?token=${token}`)
      if (res.ok) {
        setIsUnsubscribed(true)
      }
    } catch (error) {
      console.error("Unsubscribe failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10">
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Unsubscribed
              </h1>
              <p className="text-lg text-muted-foreground">
                You have been removed from our mailing list. We'll no longer
                send you emails.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-accent/5 border border-accent/20 rounded-lg p-4"
            >
              <p className="text-sm text-muted-foreground">
                💌 You can resubscribe anytime from our website.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <Link href="/">
                <Button className="w-full group">
                  Back to Home
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Unsubscribe?
            </h1>
            <p className="text-lg text-muted-foreground">
              Are you sure you want to unsubscribe from Swrk updates? You won't
              receive any more emails from us.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-accent/5 border border-accent/20 rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground">
              ⚠️ You can resubscribe anytime if you change your mind.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 pt-4"
          >
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                Keep Me Subscribed
              </Button>
            </Link>
            <button
              onClick={handleUnsubscribe}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Processing..." : "Yes, Unsubscribe"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
