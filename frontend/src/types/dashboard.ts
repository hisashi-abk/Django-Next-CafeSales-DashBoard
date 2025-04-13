// ダッシュボード関連の型定義
export interface DailySalesData {
  date: string
  total_sales: number
  order_count: number
  average_order_value: number
}

export interface WeeklySalesData {
  week_start: string
  week_end: string
  total_sales: number
  order_count: number
  average_order_value: number
}

export interface MonthlySalesData {
  month: string
  total_sales: number
  order_count: number
  average_order_value: number
}

export interface SalesSummary {
  total_sales: number
  total_orders: number
  average_order_value: number
  total_items_sold: number
  total_discount: number
}

export interface CategorySales {
  category: string
  total_sales: number
  item_count: number
  percentage: number
}

export interface SalesByFactor {
  factor: string
  total_sales: number
  order_count: number
  percentage: number
}

export interface WeatherTimeslotAnalysis {
  weather: string
  morning: number
  afternoon: number
  evening: number
  night: number
}

export interface DashboardPeriod {
  type: "daily" | "weekly" | "monthly"
  label: string
}
