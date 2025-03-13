"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { orderService, formatYen, formatDateTime } from "@/services"
import type { Order } from "@/types"

// 曜日の配列
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

export default function CalendarPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week">("month")

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const data = await orderService.getAll()
        setOrders(data)
      } catch (error) {
        console.error("注文データの取得に失敗しました", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // 月の最初の日を取得
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  // 月の最後の日を取得
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  // 週の最初の日（日曜日）を取得
  const getFirstDayOfWeek = (date: Date) => {
    const day = date.getDay()
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day)
  }

  // 週の最後の日（土曜日）を取得
  const getLastDayOfWeek = (date: Date) => {
    const firstDay = getFirstDayOfWeek(date)
    return new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 6)
  }

  // カレンダーの日付配列を生成
  const generateCalendarDays = () => {
    if (viewMode === "month") {
      const firstDay = getFirstDayOfMonth(currentDate)
      const lastDay = getLastDayOfMonth(currentDate)

      // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ...)
      const firstDayOfWeek = firstDay.getDay()

      // 前月の日を追加
      const prevMonthDays = []
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = new Date(firstDay)
        day.setDate(day.getDate() - i - 1)
        prevMonthDays.push(day)
      }

      // 当月の日を追加
      const currentMonthDays = []
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
        currentMonthDays.push(day)
      }

      // 翌月の日を追加（6週間分になるように）
      const nextMonthDays = []
      const totalDays = prevMonthDays.length + currentMonthDays.length
      const remainingDays = 42 - totalDays // 6週 x 7日 = 42

      for (let i = 1; i <= remainingDays; i++) {
        const day = new Date(lastDay)
        day.setDate(day.getDate() + i)
        nextMonthDays.push(day)
      }

      return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
    } else {
      // 週表示の場合
      const firstDay = getFirstDayOfWeek(currentDate)
      const days = []

      for (let i = 0; i < 7; i++) {
        const day = new Date(firstDay)
        day.setDate(day.getDate() + i)
        days.push(day)
      }

      return days
    }
  }

  // 指定した日の注文を取得
  const getOrdersForDay = (date: Date) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.timestamp)
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth() &&
        orderDate.getDate() === date.getDate()
      )
    })
  }

  // 前の月/週に移動
  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const firstDayOfWeek = getFirstDayOfWeek(currentDate)
      const prevWeek = new Date(firstDayOfWeek)
      prevWeek.setDate(prevWeek.getDate() - 7)
      setCurrentDate(prevWeek)
    }
  }

  // 次の月/週に移動
  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const firstDayOfWeek = getFirstDayOfWeek(currentDate)
      const nextWeek = new Date(firstDayOfWeek)
      nextWeek.setDate(nextWeek.getDate() + 7)
      setCurrentDate(nextWeek)
    }
  }

  // 今日に移動
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 注文詳細ダイアログを開く
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">注文データを読み込み中...</span>
      </div>
    )
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">注文カレンダー</h1>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "month" | "week") => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="表示モード" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">月表示</SelectItem>
              <SelectItem value="week">週表示</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={goToToday}>
            今日
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>
            {viewMode === "month"
              ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
              : `${getFirstDayOfWeek(currentDate).getFullYear()}年${getFirstDayOfWeek(currentDate).getMonth() + 1}月${getFirstDayOfWeek(currentDate).getDate()}日 - ${getLastDayOfWeek(currentDate).getMonth() + 1}月${getLastDayOfWeek(currentDate).getDate()}日`}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`text-center py-2 font-medium ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : ""}`}
              >
                {day}
              </div>
            ))}

            {/* カレンダー日付 */}
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const dayOrders = getOrdersForDay(day)

              return (
                <div
                  key={index}
                  className={`
                    min-h-24 p-1 border rounded-md
                    ${isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"}
                    ${isToday ? "ring-2 ring-primary" : ""}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`
                      text-sm font-medium
                      ${day.getDay() === 0 ? "text-red-500" : day.getDay() === 6 ? "text-blue-500" : ""}
                    `}
                    >
                      {day.getDate()}
                    </span>
                    {dayOrders.length > 0 && <Badge variant="outline">{dayOrders.length}</Badge>}
                  </div>
                  <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                    {dayOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="text-xs p-1 bg-primary/10 rounded cursor-pointer hover:bg-primary/20"
                        onClick={() => openOrderDetails(order)}
                      >
                        {new Date(order.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}{" "}
                        - {formatYen(order.total_price)}
                      </div>
                    ))}
                    {dayOrders.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">他 {dayOrders.length - 3} 件</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 注文詳細ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>注文詳細</DialogTitle>
            <DialogDescription>
              注文ID: {selectedOrder?.id} - {selectedOrder && formatDateTime(selectedOrder.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">注文タイプ</p>
                  <p>{selectedOrder.order_type_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">性別</p>
                  <p>{selectedOrder.gender_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">時間帯</p>
                  <p>{selectedOrder.time_slot_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">天気</p>
                  <p>{selectedOrder.weather_name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">注文内容</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名</TableHead>
                      <TableHead>カテゴリー</TableHead>
                      <TableHead className="text-right">価格</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.menu_item_name}</TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell className="text-right">{formatYen(item.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">割引</p>
                  <p className="text-lg font-medium">{formatYen(selectedOrder.discount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">合計金額</p>
                  <p className="text-lg font-medium">{formatYen(selectedOrder.total_price)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

