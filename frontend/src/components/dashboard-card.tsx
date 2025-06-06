import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: number
  className?: string
  children?: ReactNode
}

export function DashboardCard({ title, value, description, icon, trend, className, children }: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend !== undefined && (
          <div className={cn("mt-1 text-xs", trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "")}>
            {trend > 0 ? "+" : ""}
            {trend}% 前期比
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
