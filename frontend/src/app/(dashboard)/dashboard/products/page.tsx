"use client"

import { useEffect, useState } from "react"
import { format, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { productsApi } from "@/lib/api"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { DateRangePicker } from "@/components/date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BestsellerItem, ComboAnalysis, DiscountAnalysis, PopularItemByTimeslot } from "@/types/product"

export default function ProductAnalysisPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [bestsellers, setBestsellers] = useState<BestsellerItem[]>([])
  const [dineInPopular, setDineInPopular] = useState<BestsellerItem[]>([])
  const [takeoutPopular, setTakeoutPopular] = useState<BestsellerItem[]>([])
  const [discountAnalysis, setDiscountAnalysis] = useState<DiscountAnalysis | null>(null)
  const [dineInPopularByTimeslot, setDineInPopularByTimeslot] = useState<PopularItemByTimeslot[]>([])
  const [comboAnalysis, setComboAnalysis] = useState<ComboAnalysis[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true)
      try {
        const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

        const [bestsellersData, dineInData, takeoutData, discountData, dineInTimeslotData, comboData] =
          await Promise.all([
            productsApi.getBestsellers(10, startDate, endDate),
            productsApi.getDineInPopular(10, startDate, endDate),
            productsApi.getTakeoutPopular(10, startDate, endDate),
            productsApi.getDiscountAnalysis(startDate, endDate),
            productsApi.getDineInPopularByTimeslot(startDate, endDate),
            productsApi.getComboAnalysis(2, 10),
          ])

        setBestsellers(bestsellersData)
        setDineInPopular(dineInData)
        setTakeoutPopular(takeoutData)
        setDiscountAnalysis(discountData)
        setDineInPopularByTimeslot(dineInTimeslotData)
        setComboAnalysis(comboData)
      } catch (error) {
        console.error("商品データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductData()
  }, [dateRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">商品分析</h1>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="w-full md:w-auto" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p>読み込み中...</p>
        </div>
      ) : (
        <>
          <Tabs defaultValue="bestsellers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bestsellers">人気商品</TabsTrigger>
              <TabsTrigger value="discount">割引分析</TabsTrigger>
              <TabsTrigger value="combo">組み合わせ分析</TabsTrigger>
            </TabsList>

            <TabsContent value="bestsellers" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>全体の人気商品ランキング</CardTitle>
                    <CardDescription>期間内の売上数量ベース</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bestsellers.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.menu_item_name}</p>
                              <p className="text-xs text-muted-foreground">{item.category_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.total_quantity}個</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.total_sales)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>店内飲食の人気商品</CardTitle>
                      <CardDescription>店内飲食の売上数量ベース</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dineInPopular.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-primary-foreground text-xs">
                                {index + 1}
                              </div>
                              <p className="text-sm">{item.menu_item_name}</p>
                            </div>
                            <p className="text-sm">{item.total_quantity}個</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>テイクアウトの人気商品</CardTitle>
                      <CardDescription>テイクアウトの売上数量ベース</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {takeoutPopular.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-primary-foreground text-xs">
                                {index + 1}
                              </div>
                              <p className="text-sm">{item.menu_item_name}</p>
                            </div>
                            <p className="text-sm">{item.total_quantity}個</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>時間帯別の人気商品（店内飲食）</CardTitle>
                  <CardDescription>時間帯ごとの人気商品ランキング</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {dineInPopularByTimeslot.map((slot, index) => (
                      <div key={index}>
                        <h3 className="mb-2 font-semibold">{slot.time_slot}</h3>
                        <div className="space-y-2">
                          {slot.popular_items.slice(0, 3).map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between">
                              <p className="text-sm">{item.menu_item_name}</p>
                              <p className="text-xs text-muted-foreground">{item.total_quantity}個</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discount" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>割引分析</CardTitle>
                    <CardDescription>期間内の割引状況</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">総割引額</p>
                        <p className="font-bold">{formatCurrency(discountAnalysis?.total_discount || 0)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">割引率</p>
                        <p className="font-bold">{formatPercent(discountAnalysis?.discount_percentage || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>カテゴリー別割引</CardTitle>
                    <CardDescription>カテゴリーごとの割引状況</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {discountAnalysis?.discount_by_category.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <p className="font-medium">{item.category}</p>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.discount_amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatPercent(item.discount_percentage)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="combo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>よく一緒に注文される商品</CardTitle>
                  <CardDescription>商品の組み合わせ分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comboAnalysis.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.item_pair.join(" + ")}</p>
                          <p className="text-xs text-muted-foreground">{item.occurrence}回の組み合わせ</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.total_sales)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
