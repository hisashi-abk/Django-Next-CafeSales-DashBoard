// ダッシュボード関連のサービス
import { api } from "@/lib/api"
import type { DailyDashboard, WeeklyDashboard, MonthlyDashboard } from "@/types"

export const dashboardService = {
  // 日次ダッシュボードデータを取得
  getDaily: async (date?: Date): Promise<DailyDashboard> => {
    return api.dashboard.getDaily(date)
  },

  // 週次ダッシュボードデータを取得
  getWeekly: async (date?: Date): Promise<WeeklyDashboard> => {
    return api.dashboard.getWeekly(date)
  },

  // 月次ダッシュボードデータを取得
  getMonthly: async (date?: Date): Promise<MonthlyDashboard> => {
    return api.dashboard.getMonthly(date)
  },
}

