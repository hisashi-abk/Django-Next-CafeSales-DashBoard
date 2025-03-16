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

  // 組み合わせ分析を取得
  getComboAnalysis: async (startDate?: Date, endDate?: Date) => {
    return api.products.getComboAnalysis(startDate, endDate)
  },

  // 店内人気商品を取得
  getDineInPopular: async (limit = 10, startDate?: Date, endDate?: Date) => {
    return api.products.getDineInPopular(limit, startDate, endDate)
  },

  // 店内人気アイテムを取得
  getDineInPopularItems: async (limit = 10, startDate?: Date, endDate?: Date) => {
    return api.products.getDineInPopularItems(limit, startDate, endDate)
  },

  // 割引分析を取得
  getDiscountAnalysis: async (startDate?: Date, endDate?: Date) => {
    return api.products.getDiscountAnalysis(startDate, endDate)
  },

  // テイクアウト人気商品を取得
  getTakeoutPopular: async (limit = 10, startDate?: Date, endDate?: Date) => {
    return api.products.getTakeoutPopular(limit, startDate, endDate)
  },
}

