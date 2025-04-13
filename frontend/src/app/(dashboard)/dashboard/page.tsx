"use client"

import { useEffect, useState } from "react"
import { format, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { BarChart, PieChart, TrendingDown, TrendingUp } from "lucide-react"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { DashboardCard } from "@/components/dashboard-card"
import { DateRangePicker } from "@/components/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DashboardPeriod } from "@/types/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("daily")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const periods: DashboardPeriod[] = [
    { type: "daily", label: "日次" },
    { type: "weekly", label: "週次" },
    { type: "monthly", label: "月次" },
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const date = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined

        let data
        let salesData

        if (activeTab === "daily") {
          data = await dashboardApi.getDailyDashboard(date)
          salesData = await dashboardApi.getDailySales(
            dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
            dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          )
        } else if (activeTab === "weekly") {
          data = await dashboardApi.getWeeklyDashboard(date)
          salesData = await dashboardApi.getWeeklySales(
            dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
            dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          )
        } else {
          data = await dashboardApi.getMonthlyDashboard(date)
          salesData = await dashboardApi.getMonthlySales(
            dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
            dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          )
        }

        setDashboardData(data)
        setSalesData(salesData)
      } catch (error) {
        console.error("ダッシュボードデータの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [activeTab, dateRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <div className="flex items-center gap-4">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="w-full md:w-auto" />
        </div>
      </div>

      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {periods.map((period) => (
            <TabsTrigger key={period.type} value={period.type}>
              {period.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {periods.map((period) => (
          <TabsContent key={period.type} value={period.type} className="space-y-6">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p>読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <DashboardCard
                    title="総売上"
                    value={formatCurrency(dashboardData?.total_sales || 0)}
                    icon={<TrendingUp />}
                    trend={dashboardData?.sales_trend || 0}
                  />
                  <DashboardCard
                    title="注文数"
                    value={dashboardData?.order_count || 0}
                    icon={<BarChart />}
                    trend={dashboardData?.order_count_trend || 0}
                  />
                  <DashboardCard
                    title="平均注文金額"
                    value={formatCurrency(dashboardData?.average_order_value || 0)}
                    icon={<PieChart />}
                    trend={dashboardData?.aov_trend || 0}
                  />
                  <DashboardCard
                    title="割引額"
                    value={formatCurrency(dashboardData?.total_discount || 0)}
                    icon={<TrendingDown />}
                    trend={dashboardData?.discount_trend || 0}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>売上推移</CardTitle>
                      <CardDescription>{period.label}の売上推移グラフ</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey={
                              period.type === "daily" ? "date" : period.type === "weekly" ? "week_start" : "month"
                            }
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="total_sales"
                            name="売上"
                            stroke="var(--chart-1)"
                            activeDot={{ r: 8 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>注文数推移</CardTitle>
                      <CardDescription>{period.label}の注文数推移グラフ</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey={
                              period.type === "daily" ? "date" : period.type === "weekly" ? "week_start" : "month"
                            }
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="order_count" name="注文数" fill="var(--chart-2)" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
