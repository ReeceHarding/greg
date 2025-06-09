/*
<ai_context>
This server component provides the about section.
Explains the AI Summer Camp program for students.
</ai_context>
*/

import { Sparkles, Shield, Code2, Target, Zap, Users } from "lucide-react"

export async function AboutSection() {
  console.log("[AboutSection] Rendering about section")

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container max-w-7xl">
        <div className="mx-auto mb-16 text-center">
          <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-wider text-purple-600">
            ABOUT THE PROGRAM
          </h2>
          <h3 className="mb-6 text-3xl font-semibold sm:text-4xl md:text-5xl">
            Learn from someone who's{" "}
            <span className="text-purple-600">actually done it</span>
          </h3>
          <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-lg">
            Greg Isenberg has built and sold multiple companies. He's taught 
            hundreds of students how to use AI to build profitable businesses. 
            This isn't theory - it's proven methods from someone in the arena.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Sparkles className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">
              645 Real YouTube Videos
            </h4>
            <p className="text-muted-foreground text-sm">
              Learn from Greg's actual content. Every strategy, every tactic, 
              every insight from his journey building AI businesses.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Shield className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">
              AI-Powered Learning
            </h4>
            <p className="text-muted-foreground text-sm">
              Chat with an AI trained on all of Greg's content. Get personalized 
              advice for your specific business idea anytime.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Code2 className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">Build Real Products</h4>
            <p className="text-muted-foreground text-sm">
              8 week assignments that take you from idea to launched product. 
              Ship your first AI business while you learn.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Target className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">Live Sessions</h4>
            <p className="text-muted-foreground text-sm">
              Weekly Zoom calls with successful founders. Ask questions, get 
              feedback, and network with other builders.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Zap className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">Fast Track</h4>
            <p className="text-muted-foreground text-sm">
              While others spend years in college, you'll be making money in weeks. 
              Join students already earning $10k+ per month.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-purple-600 bg-white">
              <Users className="size-8 text-purple-600" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">Community</h4>
            <p className="text-muted-foreground text-sm">
              Connect with ambitious students building the future. Your network 
              is your net worth - start building it here.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
