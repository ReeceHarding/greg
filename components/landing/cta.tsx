/*
<ai_context>
This server component provides the final call-to-action section.
Uses purple gradient background with compelling messaging.
</ai_context>
*/

import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, DollarSign, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/firebase-auth"

export async function CTASection() {
  console.log("[CTASection] Rendering CTA section")
  
  // Check if user is logged in
  const session = await auth()
  const isLoggedIn = !!session?.userId

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          {/* Trust Signal Badge - matching hero style */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <div className="size-2 animate-pulse rounded-full bg-white" />
            <span className="text-sm font-medium text-white/90">
              Join 100+ students building successful businesses
            </span>
          </div>

          {/* Main heading - matching hero style */}
          <h2 className="mb-6 text-center text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Ready to build your{" "}
            <span className="relative">
              <span className="underline decoration-white/30 decoration-wavy underline-offset-8">
                first AI business?
              </span>
            </span>
          </h2>

          {/* Subheading */}
          <p className="mb-8 text-center text-xl text-purple-100 md:text-2xl">
            Join 645 students already building with Greg Isenberg.
            <br className="hidden md:block" />
            Start building real products that make real money.
          </p>

          {/* Feature Pills - matching hero style */}
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Clock className="size-4 text-white" />
              <span className="text-sm font-medium text-white">
                2 week delivery
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <DollarSign className="size-4 text-white" />
              <span className="text-sm font-medium text-white">
                One-time payment
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Shield className="size-4 text-white" />
              <span className="text-sm font-medium text-white">
                100% guarantee
              </span>
            </div>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {[
              {
                icon: CheckCircle,
                text: "All 645 Greg Isenberg videos"
              },
              {
                icon: CheckCircle,
                text: "AI-powered business coaching"
              },
              {
                icon: CheckCircle,
                text: "8-week startup program"
              },
              {
                icon: CheckCircle,
                text: "Weekly live sessions"
              },
              {
                icon: CheckCircle,
                text: "Direct mentor feedback"
              },
              {
                icon: CheckCircle,
                text: "100% free forever"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <feature.icon className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="group rounded-full bg-white px-8 py-6 text-lg font-medium text-purple-600 shadow-[0_10px_40px_rgba(255,255,255,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-[0_15px_50px_rgba(255,255,255,0.4)]"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group rounded-full bg-white px-8 py-6 text-lg font-medium text-purple-600 shadow-[0_10px_40px_rgba(255,255,255,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-[0_15px_50px_rgba(255,255,255,0.4)]"
                >
                  Start building today
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
          </div>

          <p className="mt-8 text-center text-white/70">
            Join 645 students already building with Greg Isenberg.
            <br className="sm:hidden" />
            <span className="sm:inline"> No credit card required.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
