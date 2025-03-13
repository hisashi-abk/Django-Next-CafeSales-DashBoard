// 注文関連のサービス
import { api } from "@/lib/api"
import type { Order } from "@/types"

export const orderService = {
  // 全注文を取得
  getAll: async (): Promise<Order[]> => {
    return api.orders.getAll()
  },

  // 特定の注文を取得
  getById: async (id: string): Promise<Order> => {
    return api.orders.getById(id)
  },
}

