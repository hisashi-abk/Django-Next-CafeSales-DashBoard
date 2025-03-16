import { fetchFromBackend } from "@/lib/api-utils"

export async function GET(request: Request) {
  return fetchFromBackend("sales/weather_timeslot_analysis", request)
}

