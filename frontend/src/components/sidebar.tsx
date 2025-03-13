"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, ShoppingBag, Calendar, Coffee, BarChart4, LineChart, PieChart } from "lucide-react"

// サイドバーナビゲーション項目のタイプ定義
interface NavItem {
  href: string
  icon: React.ReactNode
  title: string
  subItems?: Array<{
    href: string
    title: string
    icon?: React.ReactNode
  }>
}

// ナビゲーション項目の定義
const navItems: NavItem[] = [
  {
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "ダッシュボード",
    subItems: [
      {
        href: "/?tab=daily",
        title: "日次ダッシュボード",
        icon: <BarChart4 className="h-4 w-4" />,
      },
      {
        href: "/?tab=weekly",
        title: "週次ダッシュボード",
        icon: <LineChart className="h-4 w-4" />,
      },
      {
        href: "/?tab=monthly",
        title: "月次ダッシュボード",
        icon: <PieChart className="h-4 w-4" />,
      },
    ],
  },
  {
    href: "/orders",
    icon: <ShoppingBag className="h-5 w-5" />,
    title: "注文一覧",
  },
  {
    href: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
    title: "カレンダー",
  },
  {
    href: "/menu",
    icon: <Coffee className="h-5 w-5" />,
    title: "メニュー一覧",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const currentTab = searchParams.get("tab")

  // パスとクエリパラメータの両方に基づいてアクティブ状態を判断
  const isActive = (href: string) => {
    if (href.includes("?tab=")) {
      const [path, query] = href.split("?tab=")
      return pathname === path && currentTab === query
    }
    return pathname === href
  }

  return (
    <SidebarProvider>
      <ShadcnSidebar>
        <SidebarHeader className="flex h-14 items-center p-4 font-semibold text-lg">
          カフェ分析
          <SidebarTrigger className="ml-auto" />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          {navItems.map((item) => (
            <SidebarGroup key={item.href}>
              {item.subItems ? (
                <>
                  <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === item.href && !currentTab}>
                          <Link href={item.href}>
                            {item.icon}
                            <span>全体</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild isActive={isActive(subItem.href)}>
                                <Link href={subItem.href}>
                                  {subItem.icon && subItem.icon}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              ) : (
                <>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                          <Link href={item.href}>
                            {item.icon}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              )}
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-center text-muted-foreground">
          v1.0.0 - カフェ分析ダッシュボード
        </SidebarFooter>
      </ShadcnSidebar>
    </SidebarProvider>
  )
}

