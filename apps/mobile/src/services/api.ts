export type User = { id: string; email: string; name: string };
export type Child = { id: string; ownerId: string; name: string; birthDate: string; createdAt: string };
export type Photo = { id: string; childId: string; ownerId: string; dataUri: string; takenAt: string; caption: string; favorite: boolean; visibility: 'private' | 'family'; likes: string[]; comments: { id: string; userId: string; name: string; body: string; createdAt: string }[] };
export type Care = { id: string; childId: string; type: 'feeding' | 'sleep' | 'diaper'; startedAt: string; endedAt?: string; detail: string; amountMl?: number; memo: string };
export type Notification = { id: string; childId: string; photoId?: string; message: string; createdAt: string; readAt?: string };

const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export async function api<T>(path: string, options: { method?: string; token?: string; body?: object } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}/api${path}`, {
      method: options.method ?? 'GET',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message ?? `서버 오류 (${response.status})`);
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('요청 시간이 초과되었습니다. 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timeout); }
}
