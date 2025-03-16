import { fetchFromBackend } from "@/lib/api-utils";

export async function GET(request: Request) {
  return fetchFromBackend("products/dine_in_popular_items", request)
}
