// 売上関連のサービス
import { api } from "@/lib/api"
import type { SalesSummary, CategorySales } from "@/types"

export const salesService = {
  // 売上サマリーを取得
  getSummary: async (startDate?: Date, endDate?: Date): Promise<SalesSummary> => {
    return api.sales.getSummary(startDate, endDate)
  },

  // カテゴリー別売上を取得
  getCategorySales: async (startDate?: Date, endDate?: Date): Promise<CategorySales[]> => {
    return api.sales.getCategorySales(startDate, endDate)
  },
}

