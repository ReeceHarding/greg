"use server"

import { auth } from "@/lib/firebase-auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/sidebar/admin-sidebar"
import AdminTopBar from "@/components/sidebar/admin-top-bar"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("[AdminLayout] Checking admin authentication")
  const user = await auth()
  
  if (!user) {
    console.log("[AdminLayout] No authenticated user, redirecting to login")
    redirect("/login")
  }

  // Check if user is admin (will be implemented in Phase 2)
  // For now, we'll allow access but show a placeholder message
  const isAdmin = false // Placeholder - will check custom claims in Phase 2

  console.log("[AdminLayout] Rendering admin layout for user:", user.userId)

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Top Bar */}
        <AdminTopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {!isAdmin && (
            <div className="mx-auto max-w-4xl p-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive font-medium">
                  Admin access will be enabled in Phase 2 with proper role-based authentication.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
} 