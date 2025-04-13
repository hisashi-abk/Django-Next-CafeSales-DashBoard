// 商品関連の型定義
export interface MenuItem {
  id: number
  name: string
  price: number
  category: number
  category_name: string
}

export interface BestsellerItem {
  menu_item_id: number
  menu_item_name: string
  category_name: string
  count: number
  total_sales: number
}

export interface DiscountAnalysis {
  total_orders: number
  orders_with_discount: number
  discount_percentage: number
  average_discount: number
  total_discount: number
}

export interface PopularItemByTimeslot {
  time_slot: string
  items: {
    menu_item_name: string
    count: number
    total_sales: number
  }[]
}

export interface ComboAnalysis {
  items: string[]
  count: number
  total_sales: number
}
