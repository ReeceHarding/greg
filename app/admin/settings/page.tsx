"use server"

import { Suspense } from "react"
import AdminEmailManager from "./_components/admin-email-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/firebase-auth"

export default async function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage admin access and platform settings
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Admin Access</h2>
            <p className="text-sm text-muted-foreground">
              Manage email addresses that have admin access to the platform
            </p>
          </div>
          
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <AdminEmailManagerFetcher />
          </Suspense>
        </section>
      </div>
    </div>
  )
}

async function AdminEmailManagerFetcher() {
  const { getAdminEmailsAction } = await import("@/actions/admin/admin-role-actions")
  const result = await getAdminEmailsAction()
  
  console.log("[AdminSettings] Fetched admin emails:", result)
  
  // Get current user email
  const { user } = await auth()
  const currentUserEmail = user?.email || undefined
  
  console.log("[AdminSettings] Current user email:", currentUserEmail)
  
  return (
    <AdminEmailManager 
      initialEmails={result.isSuccess ? result.data : []} 
      currentUserEmail={currentUserEmail}
    />
  )
} 