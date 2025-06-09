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
  const authResult = await auth()
  
  if (!authResult.user) {
    console.log("[AdminLayout] No authenticated user, redirecting to login")
    redirect("/login")
  }

  // Check if user is admin
  if (authResult.role !== "admin") {
    console.log("[AdminLayout] User is not an admin, redirecting to dashboard")
    redirect("/dashboard")
  }

  console.log("[AdminLayout] Rendering admin layout for admin user:", authResult.userId)

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
          {children}
        </main>
      </div>
    </div>
  )
} 