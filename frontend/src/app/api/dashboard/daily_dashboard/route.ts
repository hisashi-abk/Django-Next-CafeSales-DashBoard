import { fetchFromBackend } from "@/lib/api-utils"

export async function GET(request: Request) {
  return fetchFromBackend("dashboard/daily_dashboard", request)
}

