/*
<ai_context>
This is the layout for the dashboard pages. It includes auth protection.
</ai_context>
*/

"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/firebase-auth"
import { cookies } from "next/headers"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("[DashboardLayout] Checking authentication")
  const authResult = await auth()
  
  if (!authResult.user) {
    console.log("[DashboardLayout] No authenticated user, redirecting to login")
    redirect("/login")
  }
  
  // Check if user is admin and has admin view mode selected
  if (authResult.user.customClaims?.role === "admin") {
    console.log("[DashboardLayout] User is admin, checking view mode preference")
    
    // Check cookies for view mode preference
    const cookieStore = await cookies()
    const viewModeCookie = cookieStore.get("viewMode")
    const viewMode = viewModeCookie?.value || "student"
    
    console.log("[DashboardLayout] View mode from cookie:", viewMode)
    
    if (viewMode === "admin") {
      console.log("[DashboardLayout] Admin view mode selected, redirecting to admin")
      redirect("/admin")
    }
  }
  
  console.log("[DashboardLayout] Rendering dashboard layout for user:", authResult.userId)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-border">
          <SidebarTrigger className="-ml-1" />
        </header>
        
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
