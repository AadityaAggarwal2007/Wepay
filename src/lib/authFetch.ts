/**
 * Client-side auth utilities.
 * Token is stored in localStorage — no cookies involved.
 */

const TOKEN_KEY = 'wepay_token';

/** Get the stored auth token */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Store the auth token after login/register */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove the auth token on logout */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Wrapper around fetch that auto-attaches the Bearer token.
 * Use this for ALL authenticated API calls from the client.
 *
 * Usage:
 *   const res = await authFetch('/api/dashboard');
 *   const res = await authFetch('/api/payment-links', { method: 'POST', body: ... });
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // If we get 401, token is invalid/expired — redirect to login
  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return res;
}
