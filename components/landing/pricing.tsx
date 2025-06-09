/*
<ai_context>
This server component provides the pricing section.
Shows AI Summer Camp pricing options for students.
</ai_context>
*/

import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import { auth } from "@/lib/firebase-auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function PricingSection() {
  console.log("[PricingSection] Rendering pricing section")

  // Get current user session
  const session = await auth()
  const userId = session?.userId || null

  const features = [
    "All 645 Greg Isenberg videos",
    "AI chat trained on all content", 
    "8 week project assignments",
    "Community Discord access",
    "Build your first AI business",
    "Weekly live Zoom sessions",
    "Direct mentor feedback",
    "Accountability partners",
    "Demo day with investors",
    "Job placement support"
  ]

  return (
    <section className="from-background to-muted/30 bg-gradient-to-b py-12 md:py-24" id="pricing">
      <div className="container max-w-7xl">
        <div className="mx-auto mb-16 text-center">
          <h2 className="text-primary font-mono text-sm font-bold uppercase tracking-wider">
            AI Summer Camp
          </h2>
          <h3 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl md:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              launch your AI business
            </span>
          </h3>
          <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-lg">
            Join thousands of entrepreneurs building the next generation of AI companies. 
            100% free, no credit card required.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Card className="relative z-10 border-purple-300 bg-gradient-to-b from-purple-50/50 to-white shadow-[0_0_40px_rgba(147,51,234,0.15)] dark:from-purple-900/10 dark:to-gray-900 backdrop-blur-sm p-8">
            <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
              <div className="rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-1 text-sm font-medium text-white shadow-lg">
                100% FREE
              </div>
            </div>

            <div className="mb-8 text-center">
              <h3 className="mb-2 text-2xl font-semibold">Complete Access</h3>
              <p className="text-muted-foreground">Everything included, no hidden costs</p>
            </div>

            <ul className="mb-8 space-y-3">
              {features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-purple-600" />
                  <span className="text-muted-foreground text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {userId ? (
              <Link href="/dashboard" className="block">
                <Button
                  variant="gradient"
                  className="w-full shadow-purple-md hover:shadow-purple-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup" className="block">
                <Button
                  variant="gradient"
                  className="w-full shadow-purple-md hover:shadow-purple-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600"
                >
                  Start Building Today
                </Button>
              </Link>
            )}
          </Card>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-col items-center space-y-4">
          <p className="text-muted-foreground text-sm font-medium">
            Trusted by entrepreneurs from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
            <span className="text-lg font-semibold">Stanford</span>
            <span className="text-lg font-semibold">MIT</span>
            <span className="text-lg font-semibold">Harvard</span>
            <span className="text-lg font-semibold">Y Combinator</span>
            <span className="text-lg font-semibold">Google</span>
          </div>
        </div>
      </div>
    </section>
  )
}
