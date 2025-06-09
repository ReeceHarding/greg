/*
<ai_context>
This client component provides a main navigation for the sidebar.
</ai_context>
*/

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  console.log("[NavMain] Rendering navigation items")
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              className={cn(
                "hover:bg-secondary hover:text-foreground",
                pathname === item.url && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <Link href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
