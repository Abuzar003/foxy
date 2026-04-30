import { apiRequest } from "@/lib/api";

export type OfferStatus = "pending" | "accepted" | "rejected";
export type OfferScheduleType = "single" | "multi";

export interface OfferScheduleSlot {
  start_at_utc: string;
  end_at_utc: string;
  date_local: string;
  start_time_local: string;
  end_time_local: string;
}

export interface ServiceOffer {
  id: string;
  customer_id: string;
  customer_name: string;
  provider_id: string;
  provider_name: string;
  service: string;
  base_price: number;
  offered_price: number;
  message?: string;
  provider_reply?: string;
  status: OfferStatus;
  schedule_type: OfferScheduleType;
  timezone: string;
  slots: OfferScheduleSlot[];
  total_hours: number;
  total_days: number;
  created_at: string;
  updated_at: string;
}

export interface OfferInboxResponse {
  offers: ServiceOffer[];
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
  total_count: number;
}

interface CreateOfferSinglePayload {
  provider_id: string;
  service: string;
  base_price: number;
  offered_price: number;
  message?: string;
  schedule_type: "single";
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
}

interface CreateOfferMultiPayload {
  provider_id: string;
  service: string;
  base_price: number;
  offered_price: number;
  message?: string;
  schedule_type: "multi";
  slots: Array<{ date: string; start_time: string; end_time: string }>;
  timezone: string;
}

export type CreateOfferPayload = CreateOfferSinglePayload | CreateOfferMultiPayload;

export async function createOffer(payload: CreateOfferPayload, token: string) {
  return apiRequest<ServiceOffer>("/offers", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}

export async function getCustomerOffers(status?: OfferStatus, token?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  return apiRequest<OfferInboxResponse>(`/offers/customer${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function getProviderOffers(status?: OfferStatus, token?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  return apiRequest<OfferInboxResponse>(`/offers/provider${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function updateOfferStatus(
  offerId: string,
  status: Exclude<OfferStatus, "pending">,
  token: string,
  providerReply?: string,
) {
  return apiRequest<ServiceOffer>(`/offers/${offerId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: {
      status,
      provider_reply: providerReply?.trim() || undefined,
    },
  });
}

