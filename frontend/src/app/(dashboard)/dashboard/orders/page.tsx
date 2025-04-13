"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { Eye } from "lucide-react"
import { ordersApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { Order } from "@/types/order"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const data = await ordersApi.getOrders()
        setOrders(data)
        setFilteredOrders(data)
      } catch (error) {
        console.error("注文データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.gender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.weather_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchTerm, orders])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">注文一覧</h1>
        <div className="w-full md:w-64">
          <Input placeholder="検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p>読み込み中...</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>注文ID</TableHead>
                <TableHead>日時</TableHead>
                <TableHead>性別</TableHead>
                <TableHead>注文タイプ</TableHead>
                <TableHead>天気</TableHead>
                <TableHead>時間帯</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="text-right">割引</TableHead>
                <TableHead className="text-right">合計</TableHead>
                <TableHead className="text-right">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{format(parseISO(order.timestamp), "yyyy/MM/dd HH:mm", { locale: ja })}</TableCell>
                    <TableCell>{order.gender_name}</TableCell>
                    <TableCell>{order.order_type_name}</TableCell>
                    <TableCell>{order.weather_name}</TableCell>
                    <TableCell>{order.time_slot_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.discount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.final_price)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          詳細
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    注文データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
