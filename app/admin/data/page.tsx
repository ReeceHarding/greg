"use client"

import { useState } from "react"
import { toast } from "sonner"

export default function AdminDataPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const seedAssignments = async () => {
    setLoading("assignments")
    try {
      const response = await fetch("/api/admin/seed-assignments", {
        method: "POST"
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Assignments seeded! Success: ${data.data.successCount}, Errors: ${data.data.errorCount}`)
      } else {
        toast.error("Failed to seed assignments: " + data.message)
      }
    } catch (error) {
      console.error("Error seeding assignments:", error)
      toast.error("Failed to seed assignments")
    } finally {
      setLoading(null)
    }
  }

  const importVideos = async () => {
    setLoading("videos")
    try {
      const response = await fetch("/api/youtube/import", {
        method: "POST"
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Videos imported! Imported: ${data.data.imported}, Skipped: ${data.data.skipped}`)
      } else {
        toast.error("Failed to import videos: " + data.message)
      }
    } catch (error) {
      console.error("Error importing videos:", error)
      toast.error("Failed to import videos")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Data Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Initialize and manage platform data
            </p>
          </div>

          <div className="space-y-8">
            {/* Assignments Section */}
            <div className="p-8 bg-white rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
              <p className="text-muted-foreground mb-6">
                Populate the database with 8 weeks of AI Summer Camp assignments
              </p>
              <button
                onClick={seedAssignments}
                disabled={loading !== null}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "assignments" ? "Seeding..." : "Seed Assignments"}
              </button>
            </div>

            {/* Videos Section */}
            <div className="p-8 bg-white rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">YouTube Videos</h2>
              <p className="text-muted-foreground mb-6">
                Import videos from Greg Isenberg's YouTube channel
              </p>
              <button
                onClick={importVideos}
                disabled={loading !== null}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "videos" ? "Importing..." : "Import Videos"}
              </button>
            </div>

            {/* Sessions Section */}
            <div className="p-8 bg-white rounded-2xl border border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Live Sessions</h2>
              <p className="text-muted-foreground mb-6">
                Live sessions should be created through the admin panel as they are scheduled
              </p>
              <button
                disabled
                className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed"
              >
                Manual Creation Only
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 