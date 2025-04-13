"use client"

import { useEffect, useState } from "react"
import { format, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { salesApi } from "@/lib/api"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { DateRangePicker } from "@/components/date-picker"
import { DashboardCard } from "@/components/dashboard-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CategorySales, SalesByFactor, SalesSummary, WeatherTimeslotAnalysis } from "@/types/dashboard"

export default function SalesAnalysisPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])
  const [salesByWeather, setSalesByWeather] = useState<SalesByFactor[]>([])
  const [salesByGender, setSalesByGender] = useState<SalesByFactor[]>([])
  const [weatherTimeslot, setWeatherTimeslot] = useState<WeatherTimeslotAnalysis[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      try {
        const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

        const [summaryData, categoryData, weatherData, genderData, weatherTimeslotData] = await Promise.all([
          salesApi.getSalesSummary(startDate, endDate),
          salesApi.getCategorySales(startDate, endDate),
          salesApi.getSalesByWeather(startDate, endDate),
          salesApi.getSalesByGender(startDate, endDate),
          salesApi.getWeatherTimeslotAnalysis(startDate, endDate),
        ])

        setSalesSummary(summaryData)
        setCategorySales(categoryData)
        setSalesByWeather(weatherData)
        setSalesByGender(genderData)
        setWeatherTimeslot(weatherTimeslotData)
      } catch (error) {
        console.error("売上データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [dateRange])

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">売上分析</h1>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="w-full md:w-auto" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p>読み込み中...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="総売上" value={formatCurrency(salesSummary?.total_sales || 0)} />
            <DashboardCard title="総注文数" value={salesSummary?.total_orders || 0} />
            <DashboardCard title="平均注文金額" value={formatCurrency(salesSummary?.average_order_value || 0)} />
            <DashboardCard title="割引率" value={formatPercent(salesSummary?.discount_percentage || 0)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>カテゴリー別売上</CardTitle>
                <CardDescription>カテゴリー別の売上構成</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_sales"
                      nameKey="category"
                    >
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>性別別売上</CardTitle>
                <CardDescription>性別ごとの売上構成</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByGender} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="total_sales" name="売上" fill="var(--chart-1)" />
                    <Bar dataKey="order_count" name="注文数" fill="var(--chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>天気別売上</CardTitle>
                <CardDescription>天気ごとの売上構成</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByWeather} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="total_sales" name="売上" fill="var(--chart-3)" />
                    <Bar dataKey="order_count" name="注文数" fill="var(--chart-4)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>天気×時間帯分析</CardTitle>
                <CardDescription>天気と時間帯のクロス分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">天気</th>
                        <th className="border p-2 text-right">朝</th>
                        <th className="border p-2 text-right">昼</th>
                        <th className="border p-2 text-right">夕方</th>
                        <th className="border p-2 text-right">夜</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weatherTimeslot.map((item, index) => (
                        <tr key={index}>
                          <td className="border p-2">{item.weather}</td>
                          <td className="border p-2 text-right">{formatCurrency(item.morning)}</td>
                          <td className="border p-2 text-right">{formatCurrency(item.afternoon)}</td>
                          <td className="border p-2 text-right">{formatCurrency(item.evening)}</td>
                          <td className="border p-2 text-right">{formatCurrency(item.night)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
