/** Same-tab auth updates (storage event only fires across tabs). */
export const AUTH_CHANGED_EVENT = "haazir-auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
