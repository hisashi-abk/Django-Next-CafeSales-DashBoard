"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { DataTable } from "@/components/common/DataTable"
import { orderService, formatYen, formatDateTime } from "@/services"
import type { Order, OrderItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CoffeeIcon, SandwichIcon, CakeIcon, FilterIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// カテゴリーアイコンのマッピング
const categoryIcons: { [key: string]: React.ElementType } = {
  ドリンク: CoffeeIcon,
  サンドイッチ: SandwichIcon,
  ケーキ: CakeIcon,
  // デフォルトのアイコンはCoffeeIconを使用
}

interface CategoryIconProps {
  category: string
  size?: number
  className?: string
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 20, className = "" }) => {
  const Icon = categoryIcons[category] || CoffeeIcon
  return <Icon size={size} className={`inline-block mr-2 ${className}`} />
}

export const OrderView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [searchInput, setSearchInput] = useState("")
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<"AND" | "OR">("AND")

  // 詳細フィルター用の状態
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<string[]>([])
  const [selectedWeathers, setSelectedWeathers] = useState<string[]>([])
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" })

  // 性別オプション
  const genderOptions = [
    { value: "男性", label: "男性" },
    { value: "女性", label: "女性" },
  ]

  // 注文種別オプション
  const orderTypeOptions = [
    { value: "店内", label: "店内" },
    { value: "テイクアウト", label: "テイクアウト" },
  ]

  // 天気オプション
  const weatherOptions = [
    { value: "晴れ", label: "晴れ" },
    { value: "曇り", label: "曇り" },
    { value: "雨", label: "雨" },
  ]

  // 時間帯オプション
  const timeSlotOptions = [
    { value: "モーニング", label: "モーニング" },
    { value: "ランチ", label: "ランチ" },
    { value: "ティータイム", label: "ティータイム" },
    { value: "ディナー", label: "ディナー" },
  ]

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const fetchedOrders = await orderService.getAll()
        setOrders(fetchedOrders)
        setIsLoading(false)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`注文データの読み込みに失敗しました: ${errorMessage}`)
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  // フィルター条件を適用
  const applyFilters = useCallback(() => {
    const newFilters: ColumnFiltersState = []

    // 検索語句のフィルター
    if (searchTerms.length > 0) {
      newFilters.push({
        id: "items",
        value: {
          terms: searchTerms,
          mode: searchMode,
        },
      })
    }

    // 性別フィルター
    if (selectedGenders.length > 0) {
      newFilters.push({
        id: "gender_name",
        value: selectedGenders,
      })
    }

    // 注文タイプフィルター
    if (selectedOrderTypes.length > 0) {
      newFilters.push({
        id: "order_type_name",
        value: selectedOrderTypes,
      })
    }

    // 天気フィルター
    if (selectedWeathers.length > 0) {
      newFilters.push({
        id: "weather_name",
        value: selectedWeathers,
      })
    }

    // 時間帯フィルター
    if (selectedTimeSlots.length > 0) {
      newFilters.push({
        id: "time_slot_name",
        value: selectedTimeSlots,
      })
    }

    // 価格範囲フィルター
    if (priceRange.min || priceRange.max) {
      newFilters.push({
        id: "total_price",
        value: {
          min: priceRange.min ? Number.parseInt(priceRange.min) : undefined,
          max: priceRange.max ? Number.parseInt(priceRange.max) : undefined,
        },
      })
    }

    setColumnFilters(newFilters)
  }, [searchTerms, searchMode, selectedGenders, selectedOrderTypes, selectedWeathers, selectedTimeSlots, priceRange])

  // useEffect を追加して、フィルター条件の変更を監視
  useEffect(() => {
    applyFilters()
  }, [
    searchTerms,
    searchMode,
    selectedGenders,
    selectedOrderTypes,
    selectedWeathers,
    selectedTimeSlots,
    priceRange,
    applyFilters,
  ])

  // 検索入力の処理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setSearchInput(input) // 入力値をそのまま保持
    const terms = input
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .filter((term) => term !== "")
    setSearchTerms(terms)
  }

  // 検索モードの変更ハンドラー
  const handleSearchModeChange = (value: string) => {
    setSearchMode(value as "AND" | "OR")
  }

  // フィルターのリセット処理
  const resetFilters = useCallback(() => {
    setSelectedGenders([])
    setSelectedOrderTypes([])
    setSelectedWeathers([])
    setSelectedTimeSlots([])
    setPriceRange({ min: "", max: "" })
    setSearchInput("")
    setSearchTerms([])
    setSearchMode("AND")
    setColumnFilters([])
  }, [])

  const renderFilterPopoverContent = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-4">
        {/* 性別フィルター */}
        <div className="space-y-2">
          <Label>性別</Label>
          <div className="space-y-2">
            {genderOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedGenders.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedGenders([...selectedGenders, option.value])
                    } else {
                      setSelectedGenders(selectedGenders.filter((g) => g !== option.value))
                    }
                  }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 注文タイプフィルター */}
        <div className="space-y-2">
          <Label>注文タイプ</Label>
          <div className="space-y-2">
            {orderTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedOrderTypes.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOrderTypes([...selectedOrderTypes, option.value])
                    } else {
                      setSelectedOrderTypes(selectedOrderTypes.filter((t) => t !== option.value))
                    }
                  }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 天気フィルター */}
        <div className="space-y-2">
          <Label>天気</Label>
          <div className="space-y-2">
            {weatherOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedWeathers.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedWeathers([...selectedWeathers, option.value])
                    } else {
                      setSelectedWeathers(selectedWeathers.filter((w) => w !== option.value))
                    }
                  }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 時間帯フィルター */}
        <div className="space-y-2">
          <Label>時間帯</Label>
          <div className="space-y-2">
            {timeSlotOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedTimeSlots.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTimeSlots([...selectedTimeSlots, option.value])
                    } else {
                      setSelectedTimeSlots(selectedTimeSlots.filter((t) => t !== option.value))
                    }
                  }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 価格範囲フィルター */}
        <div className="space-y-2">
          <Label>価格範囲</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="最小金額"
              value={priceRange.min}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="最大金額"
              value={priceRange.max}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={resetFilters} size="sm">
          リセット
        </Button>
        <Button onClick={applyFilters} size="sm">
          適用
        </Button>
      </div>
    </div>
  )

  // 注文アイテムの詳細表示
  const renderOrderItems = (items: OrderItem[]) => (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between">
          <span className="flex items-center">
            <CategoryIcon category={item.category_name} />
            {item.menu_item_name}
          </span>
          <span>{formatYen(item.price)}</span>
        </div>
      ))}
    </div>
  )

  // フィルターバッジの表示
  const renderFilterBadges = () => {
    const badges = []

    if (selectedGenders.length > 0) {
      badges.push(
        <Badge key="gender" variant="secondary" className="mr-2">
          性別: {selectedGenders.join(", ")}
        </Badge>,
      )
    }

    if (selectedOrderTypes.length > 0) {
      badges.push(
        <Badge key="orderType" variant="secondary" className="mr-2">
          注文タイプ: {selectedOrderTypes.join(", ")}
        </Badge>,
      )
    }

    if (selectedWeathers.length > 0) {
      badges.push(
        <Badge key="weather" variant="secondary" className="mr-2">
          天気: {selectedWeathers.join(", ")}
        </Badge>,
      )
    }

    if (selectedTimeSlots.length > 0) {
      badges.push(
        <Badge key="timeSlot" variant="secondary" className="mr-2">
          時間帯: {selectedTimeSlots.join(", ")}
        </Badge>,
      )
    }

    if (priceRange.min || priceRange.max) {
      badges.push(
        <Badge key="priceRange" variant="secondary" className="mr-2">
          価格: {priceRange.min || "0"}円 - {priceRange.max || "10,000"}円
        </Badge>,
      )
    }

    return badges
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "注文ID",
      cell: ({ row }) => row.original.id,
      enableSorting: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "timestamp",
      header: "注文日時",
      cell: ({ row }) => formatDateTime(row.original.timestamp),
      enableSorting: true,
      sortingFn: "datetime",
    },
    {
      accessorKey: "gender_name",
      header: "性別",
      cell: ({ row }) => row.original.gender_name,
      enableSorting: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue(columnId))
      },
    },
    {
      accessorKey: "order_type_name",
      header: "注文タイプ",
      cell: ({ row }) => (
        <Badge variant={row.original.order_type_name === "テイクアウト" ? "outline" : "default"}>
          {row.original.order_type_name}
        </Badge>
      ),
      enableSorting: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue(columnId))
      },
    },
    {
      accessorKey: "weather_name",
      header: "天気",
      cell: ({ row }) => row.original.weather_name,
      enableSorting: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue(columnId))
      },
    },
    {
      accessorKey: "time_slot_name",
      header: "時間帯",
      cell: ({ row }) => row.original.time_slot_name,
      enableSorting: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue(columnId))
      },
    },
    {
      accessorKey: "total_price",
      header: "合計金額",
      cell: ({ row }) => formatYen(row.original.total_price),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        return rowA.original.total_price - rowB.original.total_price
      },
      filterFn: (row, columnId, filterValue: { min?: number; max?: number }) => {
        const price = row.getValue<number>(columnId)
        const { min, max } = filterValue

        if (min !== undefined && max !== undefined) {
          return price >= min && price <= max
        }
        if (min !== undefined) {
          return price >= min
        }
        if (max !== undefined) {
          return price <= max
        }
        return true
      },
    },
    {
      accessorKey: "discount",
      header: "割引額",
      cell: ({ row }) => formatYen(row.original.discount),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        return rowA.original.discount - rowB.original.discount
      },
    },
    {
      accessorKey: "items",
      header: "注文アイテム",
      cell: ({ row }) => renderOrderItems(row.original.items),
      enableSorting: false,
      filterFn: (row, _, filterValue: { terms: string[]; mode: "AND" | "OR" }) => {
        if (!filterValue || !filterValue.terms || filterValue.terms.length === 0) return true

        const items = row.original.items
        const searchTerms = filterValue.terms.map((term) => term.toLowerCase())
        const mode = filterValue.mode

        if (mode === "AND") {
          // すべての検索語が少なくとも1つのアイテムに含まれているか
          return searchTerms.every((term) =>
            items.some(
              (item) =>
                item.menu_item_name.toLowerCase().includes(term) || item.category_name.toLowerCase().includes(term),
            ),
          )
        } else {
          // OR検索
          // いずれかの検索語が少なくとも1つのアイテムに含まれているか
          return searchTerms.some((term) =>
            items.some(
              (item) =>
                item.menu_item_name.toLowerCase().includes(term) || item.category_name.toLowerCase().includes(term),
            ),
          )
        }
      },
    },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>注文一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>注文一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>注文一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex items-center space-x-2">
            {/* 商品検索フィールドと検索モード選択 */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="商品名で検索... (スペース区切りで複数検索)"
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Select value={searchMode} onValueChange={handleSearchModeChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="検索モード" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND検索</SelectItem>
                <SelectItem value="OR">OR検索</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  詳細フィルター
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="start">
                {renderFilterPopoverContent()}
              </PopoverContent>
            </Popover>
          </div>

          {/* フィルターバッジ表示 */}
          <div className="flex flex-wrap gap-2">
            {renderFilterBadges()}
            {searchTerms.length > 0 && (
              <Badge variant="secondary" className="mr-2">
                検索語: {searchTerms.join(" ")} ({searchMode}検索)
              </Badge>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          pageSize={10}
          pageIndex={pageIndex}
          onPageIndexChange={setPageIndex}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </CardContent>
    </Card>
  )
}

export default OrderView

