"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { ordersApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { Order } from "@/types/order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { use } from "react"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // paramsをReact.use()でラップして安全にアクセスする
  const unwrappedParams = use(params)
  const orderId = unwrappedParams.id

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        const data = await ordersApi.getOrder(orderId)
        setOrder(data)
      } catch (error) {
        console.error("注文詳細の取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-4">
        <p>注文が見つかりませんでした</p>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            注文一覧に戻る
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            注文一覧に戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">注文詳細: {order.id}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>注文情報</CardTitle>
            <CardDescription>注文の基本情報</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">注文ID</dt>
                <dd className="text-lg font-semibold">{order.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">注文日時</dt>
                <dd className="text-lg font-semibold">
                  {format(parseISO(order.timestamp), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">性別</dt>
                <dd className="text-lg font-semibold">{order.gender_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">注文タイプ</dt>
                <dd className="text-lg font-semibold">{order.order_type_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">天気</dt>
                <dd className="text-lg font-semibold">{order.weather_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">時間帯</dt>
                <dd className="text-lg font-semibold">{order.time_slot_name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>金額情報</CardTitle>
            <CardDescription>注文の金額詳細</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-muted-foreground">小計</dt>
                <dd className="text-lg font-semibold">{formatCurrency(order.total_price)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-muted-foreground">割引</dt>
                <dd className="text-lg font-semibold text-destructive">-{formatCurrency(order.discount)}</dd>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <dt className="text-base font-bold">合計</dt>
                <dd className="text-xl font-bold">{formatCurrency(order.final_price)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>注文アイテム</CardTitle>
          <CardDescription>注文に含まれる商品</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品ID</TableHead>
                <TableHead>商品名</TableHead>
                <TableHead>カテゴリー</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">販売価格</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.menu_item}</TableCell>
                  <TableCell>{item.menu_item_name}</TableCell>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.menu_item_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
