/*
<ai_context>
This is the layout for the dashboard pages. It includes auth protection.
</ai_context>
*/

"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/firebase-auth"
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
