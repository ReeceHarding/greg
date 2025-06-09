/*
<ai_context>
This server component provides the projects showcase section.
Shows different types of projects the company has built.
</ai_context>
*/

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Clock, DollarSign, Rocket } from "lucide-react"

interface Project {
  title: string
  description: string
  image: string
  duration: string
  cost: string
  liveIn?: string
}

const projects: Project[] = [
  {
    title: "Internal Communication Platform",
    description:
      "Custom built alternative to Slack. Better features, owned forever, no monthly fees.",
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
    duration: "14 days",
    cost: "One time cost"
  },
  {
    title: "AI Powered Analytics Platform",
    description:
      "Custom analytics with AI insights. Stop paying monthly for features you don't need.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    duration: "18 days",
    cost: "Own forever"
  },
  {
    title: "FinTech Startup MVP",
    description:
      "Full featured MVP launched in 2 weeks. Production ready from day one.",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop",
    duration: "14 days",
    cost: "Live in 2 weeks",
    liveIn: "2 weeks"
  }
]

export async function ProjectsSection() {
  console.log("[ProjectsSection] Rendering projects showcase")

  return (
    <section
      id="projects"
      className="from-background to-background/50 bg-gradient-to-b py-12 md:py-24"
    >
      <div className="container max-w-7xl">
        <div className="mx-auto mb-20 text-center">
          <h2 className="text-primary font-mono text-sm font-bold uppercase tracking-wider">
            The Mechanism
          </h2>
          <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">
            Like using an excavator{" "}
            <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              instead of a shovel
            </span>
          </h3>
          <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-lg">
            Traditional developers code by hand. We use AI to generate thousands
            of lines of perfect code instantly. Same result, 10x faster, 90%
            cheaper.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-purple-100/20 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-purple-300/40 hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)] dark:bg-gray-900/50"
            >
              <div className="mb-4 aspect-video overflow-hidden rounded-lg">
                <img
                  alt={project.title}
                  loading="lazy"
                  width={600}
                  height={400}
                  className="size-full object-cover"
                  src={project.image}
                />
              </div>

              <h4 className="mb-2 text-lg font-semibold">{project.title}</h4>
              <p className="text-muted-foreground mb-4 text-sm">
                {project.description}
              </p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="size-4 text-purple-600" />
                  <span>{project.duration}</span>
                </div>
                {project.liveIn ? (
                  <div className="flex items-center gap-1">
                    <Rocket className="size-4 text-purple-600" />
                    <span>{project.liveIn}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-4 text-green-600" />
                    <span>{project.cost}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
