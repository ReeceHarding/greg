/*
<ai_context>
This is the about page with company information, team section, and values.
Uses purple-centric design with glassmorphism effects.
</ai_context>
*/

"use server"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import Link from "next/link"
import {
  Target,
  Users,
  Zap,
  Heart,
  Trophy,
  Code,
  Sparkles,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Lightbulb
} from "lucide-react"
export default async function AboutPage() {
  console.log("[About Page] Rendering about page")

  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description:
        "We're focused on helping developers ship faster and build better products.",
      gradient: "from-purple-600 to-purple-400"
    },
    {
      icon: Users,
      title: "Community First",
      description:
        "Built by developers, for developers. We prioritize community feedback.",
      gradient: "from-purple-500 to-purple-300"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Performance is not optional. Every millisecond counts in user experience.",
      gradient: "from-purple-600 to-purple-400"
    },
    {
      icon: Heart,
      title: "Developer Love",
      description:
        "We obsess over developer experience and making your life easier.",
      gradient: "from-purple-500 to-purple-300"
    }
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Visionary leader with 15+ years in tech innovation",
      avatar: "/avatars/sarah.jpg"
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Full-stack expert passionate about scalable architecture",
      avatar: "/avatars/michael.jpg"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Design",
      bio: "Creative mind behind our intuitive user experiences",
      avatar: "/avatars/emily.jpg"
    },
    {
      name: "David Kim",
      role: "Lead Developer",
      bio: "Open source contributor and performance optimization guru",
      avatar: "/avatars/david.jpg"
    }
  ]

  const stats = [
    { label: "Active Users", value: "10,000+", icon: Users },
    { label: "GitHub Stars", value: "2,500+", icon: Trophy },
    { label: "Components", value: "50+", icon: Code },
    { label: "Happy Developers", value: "1,000+", icon: Heart }
  ]

  return (
    <div className="py-16 md:py-24">
      {/* Hero Section */}
      <section className="relative bg-white py-24">
        <div className="absolute inset-0 -z-10 bg-white" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h1 className="font-instrument mb-6 text-6xl font-bold leading-tight tracking-tight text-black">
              Building the Future of{" "}
              <span className="text-purple-600">Digital Experiences</span>
            </h1>

            <h2 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
              Building the future of
              <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                {" "}
                web development
              </span>
            </h2>

            <p className="text-muted-foreground mb-8 text-lg leading-relaxed md:text-xl">
              We're on a mission to help developers ship faster and build better
              products. Our Firebase boilerplate is just the beginning of that
              journey.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button variant="gradient" size="lg" className="group">
                  <span className="flex items-center gap-3">
                    Get Started
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>

              <Link href="/contact">
                <Button variant="outline" size="lg">
                  <Heart className="mr-2 size-5" />
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-16 md:mb-24">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <Card
                key={stat.label}
                className="border-purple-100/20 bg-white/80 text-center backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)] dark:bg-gray-900/80"
              >
                <CardHeader className="pb-2">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-purple-600 bg-white shadow-sm">
                    <Lightbulb className="size-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-purple-600">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-16 md:mb-24 md:py-24">
        <div className="container max-w-4xl">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200/30 bg-white/50 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="size-4 text-purple-600" />
              <span className="text-muted-foreground text-sm font-medium">
                Our Mission
              </span>
            </div>

            <h3 className="mb-6 text-3xl font-semibold md:text-4xl">
              Empowering developers to build faster
            </h3>

            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              We believe that developers should spend their time building unique
              features, not reinventing common functionality. That's why we
              created this comprehensive Firebase boilerplate - to give you a
              production-ready foundation so you can focus on what makes your
              product special.
            </p>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Every decision we make is guided by one question: "Will this help
              developers ship faster and build better products?" If the answer
              is yes, we do it.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-16 md:mb-24">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-semibold md:text-4xl">
              Our Values
            </h3>
            <p className="text-muted-foreground text-lg">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {values.map((value, index) => (
              <div key={value.title} className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

                <div className="relative text-center">
                  <div
                    className={`mx-auto flex size-14 items-center justify-center rounded-full border border-purple-600 bg-white shadow-lg`}
                  >
                    <value.icon className="size-6 text-purple-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16 md:mb-24">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-semibold md:text-4xl">
              Meet the Team
            </h3>
            <p className="text-muted-foreground text-lg">
              The people behind Firebase Boilerplate
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {team.map((member, index) => (
              <Card
                key={member.name}
                className="border-purple-100/20 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)] dark:bg-gray-900/80"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full border-2 border-purple-600 bg-white text-4xl shadow-lg">
                    {member.name.charAt(0)}
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="font-medium text-purple-600">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4 text-sm">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-4 rounded-3xl bg-purple-600 py-16 md:mx-8 md:py-24">
        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="font-instrument mb-6 text-4xl font-bold md:text-5xl">
            Ready to Build Something Amazing?
          </h2>
          <p className="mb-8 text-xl text-purple-100">
            Join thousands of developers who are already creating incredible
            products with our platform.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-2xl"
          >
            Get Started Today
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}
