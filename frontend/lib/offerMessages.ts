import { apiRequest, ApiError } from "@/lib/api";

export interface OfferMessage {
  sender_id: string;
  sender_role: "customer" | "provider";
  text: string;
  created_at: string;
}

interface OfferMessagesResponse {
  offer_id: string;
  messages: OfferMessage[];
}

function resolveAuthToken(token?: string) {
  const resolved =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  if (!resolved || resolved === "undefined" || resolved === "null") {
    throw new ApiError("Missing access token. Please login again.", 401);
  }
  return resolved;
}

export async function getOfferMessages(offerId: string, token: string, before?: string, limit = 50) {
  const authToken = resolveAuthToken(token);
  const params = new URLSearchParams();
  if (before) params.set("before", before);
  params.set("limit", String(limit));
  const query = params.toString();

  const response = await apiRequest<OfferMessagesResponse>(
    `/offers/${offerId}/messages${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
  return response.messages;
}

export async function sendOfferMessage(offerId: string, text: string, token: string) {
  const authToken = resolveAuthToken(token);
  return apiRequest<OfferMessage>(`/offers/${offerId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: { text },
  });
}
