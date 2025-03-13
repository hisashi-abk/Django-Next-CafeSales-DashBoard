import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">注文カレンダー</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>カレンダー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">カレンダーデータを読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
