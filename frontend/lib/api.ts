const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => extractErrorMessage(item))
      .filter((item): item is string => Boolean(item));
    return messages.length > 0 ? messages.join("; ") : null;
  }

  if (value && typeof value === "object") {
    if ("msg" in value) {
      return extractErrorMessage((value as { msg?: unknown }).msg);
    }
    if ("message" in value) {
      return extractErrorMessage((value as { message?: unknown }).message);
    }
    if ("detail" in value) {
      return extractErrorMessage((value as { detail?: unknown }).detail);
    }
  }

  return null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = extractErrorMessage(payload) ?? "Request failed";
    throw new ApiError(detail, response.status);
  }

  return payload as T;
}

export { API_BASE_URL };
