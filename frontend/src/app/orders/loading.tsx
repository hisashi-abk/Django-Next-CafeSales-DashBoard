import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">注文一覧</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>注文一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">注文データを読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
