"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ImportVideosButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleImport = async () => {
    setLoading(true)
    console.log("[ImportVideosButton] Starting video import...")
    
    try {
      const response = await fetch('/api/youtube/import', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log("[ImportVideosButton] Import response:", data)
      
      if (response.ok && data.success) {
        toast.success(`Successfully imported ${data.data.imported} videos!`)
        // Refresh the page to show the new videos
        router.refresh()
      } else {
        toast.error(data.message || "Failed to import videos")
      }
    } catch (error) {
      console.error("[ImportVideosButton] Import error:", error)
      toast.error("Failed to import videos. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleImport}
      disabled={loading}
      className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Importing..." : "Import Videos from YouTube"}
    </button>
  )
} 