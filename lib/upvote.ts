/**
 * Anonymous upvote: one vote per "voter" (browser identity via cookie).
 * No user account required.
 */

const VOTER_COOKIE = "attensi_voter_id";
const VOTER_COOKIE_MAX_AGE_DAYS = 365;
const UPVOTED_STORAGE_KEY = "attensi_upvoted";

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Get or create anonymous voter id (persisted in cookie). */
export function getVoterId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${VOTER_COOKIE}=([^;]*)`));
  const existing = match ? decodeURIComponent(match[1]).trim() : "";
  if (existing.length >= 8) return existing;
  const id = randomId();
  document.cookie = `${VOTER_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${VOTER_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
  return id;
}

/** Check if the current voter has already upvoted this request (from localStorage). */
export function hasUpvoted(requestId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(UPVOTED_STORAGE_KEY);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return Array.isArray(ids) && ids.includes(requestId);
  } catch {
    return false;
  }
}

/** Mark this request as upvoted by the current voter (call after successful upvote). */
export function markUpvoted(requestId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(UPVOTED_STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return;
    if (!ids.includes(requestId)) {
      ids.push(requestId);
      localStorage.setItem(UPVOTED_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

/** Remove this request from the upvoted list (call after successfully removing upvote). */
export function unmarkUpvoted(requestId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(UPVOTED_STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return;
    const next = ids.filter((id) => id !== requestId);
    if (next.length !== ids.length) {
      localStorage.setItem(UPVOTED_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
}
