export type HealthResponse = { status: 'ok'; service: string; timestamp: string };
const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function checkApiHealth(): Promise<HealthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (
      !data || typeof data !== 'object' || !('status' in data) ||
      data.status !== 'ok' || !('service' in data) ||
      typeof data.service !== 'string' || !('timestamp' in data) ||
      typeof data.timestamp !== 'string'
    ) throw new Error('예상하지 못한 서버 응답입니다.');
    return data as HealthResponse;
  } finally {
    clearTimeout(timeout);
  }
}