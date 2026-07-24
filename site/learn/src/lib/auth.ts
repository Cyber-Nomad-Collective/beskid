/** Auth integration reusing Beskid auth-hub (same flow as tracker). */

export interface AuthUser {
  login: string;
  name: string | null;
  avatarUrl: string;
}

const AUTH_HUB_BASE: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_AUTH_HUB_URL)
  ?? 'https://auth.beskid-lang.org';

export function authHubLoginUrl(): string {
  const base = AUTH_HUB_BASE.replace(/\/$/, '');
  return `${base}/login?app=learn`;
}

export function authHubProfileUrl(): string {
  const base = AUTH_HUB_BASE.replace(/\/$/, '');
  return `${base}/profile`;
}

export async function fetchAuthUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
