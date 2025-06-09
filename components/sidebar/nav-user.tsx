/*
<ai_context>
This client component provides a user button for the sidebar using Firebase auth.
</ai_context>
*/

"use client"

import { ChevronsUpDown, LogOut, Settings, User, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase-client"
import { onAuthStateChanged } from "firebase/auth"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  console.log("[NavUser] Component rendered")
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<"student" | "admin">("student")

  // Listen to auth state changes
  useEffect(() => {
    console.log("[NavUser] Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[NavUser] User authenticated:", firebaseUser.uid)
        
        // Get user's custom claims to check if admin
        const idTokenResult = await firebaseUser.getIdTokenResult()
        const userIsAdmin = idTokenResult.claims.role === "admin"
        console.log("[NavUser] User role:", idTokenResult.claims.role)
        console.log("[NavUser] Is admin:", userIsAdmin)
        
        setUser({
          name: firebaseUser.displayName || "Student",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || "",
        })
        setIsAdmin(userIsAdmin)
        
        // Load view mode preference from cookie
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        
        const savedViewMode = getCookieValue("viewMode")
        if (savedViewMode === "admin" && userIsAdmin) {
          setViewMode("admin")
        }
      } else {
        console.log("[NavUser] No user authenticated")
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    console.log("[NavUser] Signing out")
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      })
      router.push("/")
    } catch (error) {
      console.error("[NavUser] Error signing out:", error)
    }
  }

  const handleViewModeSwitch = () => {
    console.log("[NavUser] Quick switching view mode")
    const newMode = viewMode === "student" ? "admin" : "student"
    setViewMode(newMode)
    
    // Set cookie instead of localStorage
    document.cookie = `viewMode=${newMode}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
    
    // Redirect based on new mode
    if (newMode === "admin") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
    router.refresh() // Force refresh to apply the new view mode
  }

  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Quick view mode switch for admins */}
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={handleViewModeSwitch} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Switch to {viewMode === "student" ? "Admin" : "Student"} View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
