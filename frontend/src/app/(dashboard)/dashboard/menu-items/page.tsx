"use client"

import { useEffect, useState } from "react"
import { menuItemsApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { MenuItem } from "@/types/product"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true)
      try {
        const data = await menuItemsApi.getMenuItems()
        setMenuItems(data)
        setFilteredItems(data)

        // カテゴリーの一覧を抽出
        const uniqueCategories = Array.from(
          new Set(data.map((item) => JSON.stringify({ id: item.category, name: item.category_name }))),
        ).map((item) => JSON.parse(item))
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("メニューデータの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItems()
  }, [])

  useEffect(() => {
    let filtered = menuItems

    if (searchTerm) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category.toString() === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [searchTerm, categoryFilter, menuItems])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">メニュー一覧</h1>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="商品名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="カテゴリー" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <TableHead>ID</TableHead>
                <TableHead>商品名</TableHead>
                <TableHead>カテゴリー</TableHead>
                <TableHead className="text-right">価格</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    メニューアイテムがありません
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
