"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import { getAllProfilesAction } from "@/actions/db/profiles-actions"
import StudentsManagementClient from "./_components/students-management-client"

export default async function AdminStudentsPage() {
  console.log("[Admin Students Page] Checking authentication")
  
  const authResult = await auth()
  if (!authResult.user || !authResult.user.customClaims || authResult.user.customClaims.role !== "admin") {
    console.log("[Admin Students Page] Unauthorized access")
    redirect("/")
  }
  
  console.log("[Admin Students Page] Fetching all student profiles")
  const profilesResult = await getAllProfilesAction()
  
  const profiles = profilesResult.isSuccess ? profilesResult.data : []
  console.log(`[Admin Students Page] Found ${profiles.length} profiles`)
  
  // Serialize profiles for client component
  const serializedProfiles = profiles.map(profile => ({
    id: profile.id || profile.userId,
    userId: profile.userId,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    role: "student" as const, // We'll need to check admin emails separately
    createdAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : 
               (profile.createdAt as any)?.toDate ? (profile.createdAt as any).toDate().toISOString() : 
               new Date().toISOString(),
    lastActiveAt: (profile as any).lastActiveAt instanceof Date ? (profile as any).lastActiveAt.toISOString() : 
                  (profile as any).lastActiveAt?.toDate ? (profile as any).lastActiveAt.toDate().toISOString() : 
                  undefined
  }))
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Students</h1>
        <p className="text-muted-foreground">Manage and monitor student progress</p>
      </div>
      
      <StudentsManagementClient 
        initialProfiles={serializedProfiles}
      />
    </div>
  )
} 