// 共通のユーティリティ関数
// 日付をYYYY-MM-DD形式に変換する関数
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// 日本円表示用のフォーマッター
export function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(value)
}

// 日時フォーマッター
export function formatDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr)
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

