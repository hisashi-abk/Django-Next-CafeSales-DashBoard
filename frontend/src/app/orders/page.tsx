"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { orderService } from "@/services"
import type { Order } from "@/types"
import { OrderView } from "@/components/OrderView"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

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

  // 検索フィルター
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.gender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.weather_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.time_slot_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // ページネーション
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">注文データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">注文一覧</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新規注文
        </Button>
      </div>

      <OrderView />
    </div>
  )
}

