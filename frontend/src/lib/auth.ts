export type ProtocolRole =
  | 'PROJECT_PROPONENT'
  | 'INDEPENDENT_VERIFIER'
  | 'CORPORATE_BUYER'
  | 'REGULATOR_AUDITOR';

export interface AuthUser {
  id: string;
  loginId: string;
  displayName: string;
  organization: string;
  role: ProtocolRole;
  walletAddress: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'carbonyx_session_token';

export async function readApiJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const body = await response.text();
    const looksLikeHtml = /<!doctype|<html/i.test(body);
    throw new Error(
      looksLikeHtml
        ? 'The API returned the frontend HTML page. Restart the backend and verify VITE_API_URL.'
        : `The API returned an unsupported response (${response.status}).`
    );
  }
  return response.json() as Promise<T>;
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && token) {
    clearAuthToken();
    window.dispatchEvent(new Event('carbonyx:session-expired'));
  }
  return response;
}
