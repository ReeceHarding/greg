"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"

export default function AdminTopBar() {
  console.log("[AdminTopBar] Component rendered")
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    console.log("[AdminTopBar] Signing out")
    try {
      await signOut(auth)
      await fetch("/api/auth/session", {
        method: "DELETE",
      })
      router.push("/")
    } catch (error) {
      console.error("[AdminTopBar] Error signing out:", error)
    }
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage students, assignments, and content
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">A</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  Profile Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  Admin Settings
                </a>
                <hr className="my-1 border-border" />
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 