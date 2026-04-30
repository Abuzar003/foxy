import { apiRequest } from "@/lib/api";

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

export async function getOfferMessages(offerId: string, token: string, before?: string, limit = 50) {
  const params = new URLSearchParams();
  if (before) params.set("before", before);
  params.set("limit", String(limit));
  const query = params.toString();

  const response = await apiRequest<OfferMessagesResponse>(
    `/offers/${offerId}/messages${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.messages;
}

export async function sendOfferMessage(offerId: string, text: string, token: string) {
  return apiRequest<OfferMessage>(`/offers/${offerId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { text },
  });
}
