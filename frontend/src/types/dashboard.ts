// ダッシュボード関連の型定義
export interface DailyDashboard {
  date: string
  sales_summary: SalesSummary
  orders: Order[]
  takeout_rate: number
  popular_items: CategorySales[]
  customer_count: number
  avg_order_value: number
  total_discount: number
  hourly_sales: {
    hour: number
    total_sales: number
    order_count: number
  }[]
  customer_demographics: {
    gender_distribution: {
      gender__name: string
      count: number
    }[]
  }
}

export interface WeeklyDashboard {
  week_start: string
  week_end: string
  sales_summary: SalesSummary
  weather_distribution: {
    weather__name: string
    count: number
  }[]
  orders: Order[]
  takeout_rate: number
  popular_items: CategorySales[]
  customer_count: number
  avg_order_value: number
  total_discount: number
  daily_sales_breakdown: {
    period: string
    total_sales: number
    total_orders: number
    avg_order_value: number
    total_discount: number
    net_sales: number
  }[]
  customer_demographics: {
    gender_distribution: {
      gender__name: string
      count: number
    }[]
  }
}

export interface MonthlyDashboard {
  month_start: string
  month_end: string
  sales_summary: SalesSummary
  weather_distribution: {
    weather__name: string
    count: number
  }[]
  orders: Order[]
  takeout_rate: number
  popular_items: CategorySales[]
  customer_count: number
  avg_order_value: number
  total_discount: number
  weekly_sales_breakdown: {
    period: string
    total_sales: number
    total_orders: number
    avg_order_value: number
    total_discount: number
    net_sales: number
  }[]
  customer_demographics: {
    gender_distribution: {
      gender__name: string
      count: number
    }[]
  }
}

// 共通型のインポート
import type { SalesSummary, CategorySales } from "./sales"
import type { Order } from "./common"

