"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import SettingsClient from "./_components/settings-client"

export default async function SettingsPage() {
  console.log("[Settings Page] Checking authentication")
  
  const authResult = await auth()
  if (!authResult.user) {
    console.log("[Settings Page] No user found, redirecting to login")
    redirect("/login")
  }
  
  console.log("[Settings Page] Fetching user profile")
  const profileResult = await getProfileByUserIdAction(authResult.user.uid)
  
  if (!profileResult.isSuccess || !profileResult.data) {
    console.error("[Settings Page] Failed to fetch user profile")
    redirect("/dashboard")
  }
  
  // Check if user has admin role from Firebase auth
  const isAdmin = authResult.user.customClaims?.role === "admin"
  
  console.log("[Settings Page] User role:", authResult.user.customClaims?.role)
  console.log("[Settings Page] Is admin:", isAdmin)
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>
      
      <SettingsClient 
        userId={authResult.user.uid}
        profile={profileResult.data}
        isAdmin={isAdmin}
      />
    </div>
  )
} 