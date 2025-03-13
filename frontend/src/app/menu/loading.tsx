import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">メニュー一覧</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-h-[300px]">
          <CardHeader>
            <CardTitle>人気メニューランキング</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader>
            <CardTitle>カテゴリー別メニュー数</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">メニューデータを読み込み中...</span>
        </CardContent>
      </Card>
    </div>
  )
}
