import { fetchFromBackend } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  return fetchFromBackend(`orders/${id}`, request)
}
