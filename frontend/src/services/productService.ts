// 商品・メニュー関連のサービス
import { api } from "@/lib/api"
import type { MenuItem, Bestseller } from "@/types"

export const productService = {
  // 全メニューアイテムを取得
  getAllMenuItems: async (): Promise<MenuItem[]> => {
    return api.menuItems.getAll()
  },

  // 特定のメニューアイテムを取得
  getMenuItemById: async (id: number): Promise<MenuItem> => {
    return api.menuItems.getById(id)
  },

  // ベストセラー商品を取得
  getBestsellers: async (limit = 10, startDate?: Date, endDate?: Date): Promise<Bestseller[]> => {
    return api.products.getBestsellers(limit, startDate, endDate)
  },
}

