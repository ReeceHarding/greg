/*
<ai_context>
This client component provides the hero section for the landing page.
Updated with beautiful purple-centric design and animations.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import posthog from "posthog-js"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import FirestoreSetupNotice from "@/components/utilities/firestore-setup-notice"

export const HeroSection = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showFirestoreSetup, setShowFirestoreSetup] = useState(false)

  const handleGetStartedClick = async () => {
    console.log("[HeroSection] Start building clicked - initiating Google auth")
    setLoading(true)

    try {
      // Capture analytics event
      posthog.capture("clicked_get_started")

      // Initialize Google auth provider
      const provider = new GoogleAuthProvider()

      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider)
      console.log("[HeroSection] Google auth successful:", result.user.uid)

      // Check if this is a new user
      const isNewUser =
        result.user.metadata.creationTime ===
        result.user.metadata.lastSignInTime
      console.log("[HeroSection] Is new user:", isNewUser)

      // Get the ID token with force refresh to ensure it's valid
      const idToken = await result.user.getIdToken(true)
      console.log("[HeroSection] ID token obtained, length:", idToken?.length)

      // Small delay to ensure token is propagated
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create session cookie
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken, isNewUser })
      })

      console.log("[HeroSection] Session API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[HeroSection] Session API error:", errorData)
        const errorMessage = errorData?.error || "Failed to create session"

        // Check if it's a Firestore not enabled error
        if (
          errorMessage.includes("Firestore is not enabled") ||
          errorMessage.includes("Firestore not enabled")
        ) {
          console.log(
            "[HeroSection] Firestore not enabled - showing setup notice"
          )
          setShowFirestoreSetup(true)
          setLoading(false)
          return
        }

        throw new Error(errorMessage)
      }

      console.log("[HeroSection] Session created successfully")

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("[HeroSection] Auth error:", error)
      // User cancelled or error occurred
      setLoading(false)
    }
  }

  return (
    <>
      <section className="relative">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[10%] top-20 size-72 animate-pulse rounded-full bg-purple-200/20 blur-3xl" />
          <div
            className="absolute right-[15%] top-40 size-96 animate-pulse rounded-full bg-purple-300/20 blur-3xl"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container relative z-10 py-20 md:pb-40 md:pt-28 lg:pb-48">
          <div className="mx-auto max-w-5xl text-center">
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200/30 bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50"
            >
              <div className="size-2 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-purple-400" />
              <span className="text-muted-foreground text-sm font-medium">
                Trusted by 100+ businesses saving millions
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="font-instrument mb-10 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
            >
              Learn to build{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  AI businesses
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <path
                    d="M2 9C2 75 3 150 3C225 3 298 9 298 9"
                    stroke="url(#paint0_linear)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear"
                      x1="2"
                      y1="9"
                      x2="298"
                      y2="9"
                    >
                      <stop stopColor="#9333EA" />
                      <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{" "}
              <br />
              <span className="text-muted-foreground mt-3 inline-block">
                that make real money
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="text-muted-foreground mb-8 text-lg leading-relaxed md:text-xl"
            >
              Join 645 students building businesses with Greg Isenberg's proven methods.{" "}
              <span className="inline-flex items-center gap-1 text-purple-700">
                100% free
              </span>
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="mb-10 flex flex-wrap justify-center gap-3"
            >
              {[
                "No monthly fees ever",
                "Built by AI experts",
                "100% satisfaction guarantee"
              ].map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2"
                >
                  <Check className="size-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            >
              <Button
                onClick={handleGetStartedClick}
                disabled={loading}
                variant="gradient"
                size="lg"
                className="shadow-purple-md hover:shadow-purple-lg hover-lift group rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-6 text-lg font-medium text-white hover:from-purple-700 hover:to-purple-600"
              >
                <span className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Start building for free
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>
              <p className="text-muted-foreground mt-4 text-sm">
                7-day free trial • No credit card required • Cancel anytime
              </p>
            </motion.div>

            {/* Social proof avatars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
              className="mt-16 flex items-center justify-center gap-6"
            >
              <div className="flex -space-x-3">
                {["elonmusk", "sama", "naval", "paulg", "patrickc"].map(
                  (handle, i) => (
                    <img
                      key={handle}
                      src={`https://unavatar.io/twitter/${handle}`}
                      alt="User avatar"
                      className="size-10 rounded-full border-2 border-white shadow-sm"
                    />
                  )
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="size-4 fill-current text-yellow-400"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">
                  Loved by 100+ businesses
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Show Firestore setup notice if needed */}
      {showFirestoreSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <FirestoreSetupNotice />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                setShowFirestoreSetup(false)
                window.location.reload()
              }}
            >
              I've enabled Firestore, refresh the page
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
