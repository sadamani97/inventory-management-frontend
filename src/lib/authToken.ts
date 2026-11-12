/**
 * Secure in-memory & cookie-backed token manager.
 * Eliminates reliance on localStorage and sessionStorage for industrial security standards.
 */

let memoryToken: string | null = null;

const COOKIE_NAME = "auth_token";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${isSecure ? "; Secure" : ""}`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal) {
    memoryToken = cookieVal;
    return cookieVal;
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (!token) return;
  memoryToken = token;
  setCookie(COOKIE_NAME, token);
}

export function removeAuthToken(): void {
  memoryToken = null;
  deleteCookie(COOKIE_NAME);
}

export function hasAuthToken(): boolean {
  return Boolean(getAuthToken());
}
