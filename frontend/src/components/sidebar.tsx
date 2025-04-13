"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Coffee, Home, Package, ShoppingBag, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "ダッシュボード",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "売上分析",
      icon: BarChart3,
      href: "/dashboard/sales",
      active: pathname === "/dashboard/sales",
    },
    {
      label: "商品分析",
      icon: Coffee,
      href: "/dashboard/products",
      active: pathname === "/dashboard/products",
    },
    {
      label: "注文管理",
      icon: ShoppingBag,
      href: "/dashboard/orders",
      active: pathname === "/dashboard/orders",
    },
    {
      label: "メニュー管理",
      icon: Package,
      href: "/dashboard/menu-items",
      active: pathname === "/dashboard/menu-items",
    },
    {
      label: "顧客管理",
      icon: Users,
      href: "/dashboard/customers",
      active: pathname === "/dashboard/customers",
    },
  ]

  return (
    <div className={cn("pb-12 w-64 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <Link href="/dashboard">
            <h2 className="text-2xl font-bold tracking-tight">カフェダッシュボード</h2>
          </Link>
          <p className="text-sm text-muted-foreground">売上・商品分析ツール</p>
        </div>
        <div className="px-4">
          <div className="space-y-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={route.active ? "default" : "ghost"}
                className={cn("w-full justify-start", route.active ? "bg-primary text-primary-foreground" : "")}
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="mr-2 h-5 w-5" />
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
