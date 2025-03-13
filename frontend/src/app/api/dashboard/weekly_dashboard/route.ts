import { NextResponse } from "next/server"

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  const queryString = date ? `?date=${date}` : ""

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dashboard/weekly_dashboard${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // 60秒間キャッシュ
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "バックエンドAPIからのデータ取得に失敗しました" }, { status: 500 })
  }
}

