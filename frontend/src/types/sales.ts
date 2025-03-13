// 売上関連の型定義
export interface SalesSummary {
  total_amount: number
  total_orders: number
  avg_order_value: number
  total_discount: number
  net_sales: number
}

export interface CategorySales {
  menu_item__category__name: string
  total_sales: number
  items_sold: number
}
