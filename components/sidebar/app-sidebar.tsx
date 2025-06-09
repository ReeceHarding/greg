/*
<ai_context>
This is the main sidebar component for the dashboard.
Uses shadcn's sidebar components with purple-centric design.
</ai_context>
*/

"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Home,
  FileText,
  ChartBar,
  Video,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Student navigation items
const studentNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Videos",
    url: "/dashboard/videos",
    icon: Video,
  },
  {
    title: "Assignments",
    url: "/dashboard/assignments",
    icon: FileText,
  },
  {
    title: "AI Chat",
    url: "/dashboard/chat",
    icon: Bot,
  },
  {
    title: "Progress",
    url: "/dashboard/progress",
    icon: ChartBar,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log("[AppSidebar] Student sidebar rendered")
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AI Summer Camp</span>
            <span className="truncate text-xs text-muted-foreground">Student Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={studentNavItems} />
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
