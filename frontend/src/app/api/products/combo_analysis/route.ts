import { fetchFromBackend } from "@/lib/api-utils";

export async function GET(request: Request) {
  return fetchFromBackend("products/combo_analysis", request)
}
