import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

process.env.DATA_FILE = join(tmpdir(), `ssukssuk-api-${randomUUID()}.json`);
const { createApp } = await import('./app.js');
const server = createApp().listen(0);
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not start test server');
const base = `http://127.0.0.1:${address.port}/api`;
after(() => { server.close(); try { unlinkSync(process.env.DATA_FILE!); } catch {} });

async function request(path: string, method = 'GET', token?: string, body?: object) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, json: response.status === 204 ? null : await response.json() as any };
}

test('회원별 아이·사진·육아 기록 분리와 입력 검증', async () => {
  const first = await request('/auth/register', 'POST', undefined, { name: '엄마', email: 'a@example.com', password: 'password123' });
  assert.equal(first.status, 201);
  const token = first.json.token as string;
  assert.equal((await request('/me', 'PATCH', token, { name: '' })).status, 400);
  assert.equal((await request('/me', 'PATCH', token, { name: '새 이름' })).json.user.name, '새 이름');
  assert.equal((await request('/me', 'GET', token)).json.user.name, '새 이름');
  assert.equal((await request('/auth/register', 'POST', undefined, { name: '중복', email: 'a@example.com', password: 'password123' })).status, 409);
  assert.equal((await request('/auth/login', 'POST', undefined, { email: 'a@example.com', password: 'wrongpass' })).status, 401);
  const other = await request('/auth/register', 'POST', undefined, { name: '아빠', email: 'b@example.com', password: 'password123' });
  const otherToken = other.json.token as string;
  assert.equal((await request('/children', 'POST', token, { name: '아이', birthDate: '2025-02-30' })).status, 400);
  const created = await request('/children', 'POST', token, { name: '아이', birthDate: '2025-02-01' });
  assert.equal(created.status, 201);
  const childId = created.json.child.id as string;
  assert.equal((await request(`/children/${childId}/photos`, 'GET', otherToken)).status, 404);
  assert.equal((await request(`/children/${childId}/care`, 'GET', otherToken)).status, 404);
  const start = '2026-01-01T09:00:00.000Z', end = '2026-01-01T10:00:00.000Z';
  assert.equal((await request(`/children/${childId}/care`, 'POST', token, { type: 'sleep', startedAt: end, endedAt: start })).status, 400);
  assert.equal((await request(`/children/${childId}/care`, 'POST', token, { type: 'sleep', startedAt: start, endedAt: end })).status, 201);
  assert.equal((await request(`/children/${childId}/care`, 'POST', token, { type: 'sleep', startedAt: start, endedAt: end })).status, 409);
  assert.equal((await request(`/children/${childId}/care`, 'POST', token, { type: 'sleep', startedAt: '2026-01-01T09:30:00.000Z', endedAt: '2026-01-01T10:30:00.000Z' })).status, 409);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
  const photo = await request(`/children/${childId}/photos`, 'POST', token, { dataUri: `data:image/png;base64,${png}` });
  assert.equal(photo.status, 201);
  assert.equal((await request(`/photos/${photo.json.photo.id}`, 'PATCH', otherToken, { favorite: true })).status, 404);
  assert.equal((await request(`/photos/${photo.json.photo.id}`, 'PATCH', token, { favorite: true, caption: '첫 사진' })).json.photo.caption, '첫 사진');
  assert.equal((await request('/children', 'GET', otherToken)).json.children.length, 0);
  const invite = await request(`/children/${childId}/invites`, 'POST', token);
  assert.equal(invite.status, 201);
  assert.equal((await request('/family/join', 'POST', otherToken, { code: invite.json.invite.code })).status, 200);
  assert.equal((await request('/children', 'GET', otherToken)).json.children.length, 1);
  assert.equal((await request(`/children/${childId}/photos`, 'GET', otherToken)).json.photos.length, 0);
  assert.equal((await request(`/children/${childId}/care`, 'GET', otherToken)).status, 404);
  assert.equal((await request(`/photos/${photo.json.photo.id}`, 'PATCH', token, { visibility: 'family' })).status, 200);
  assert.equal((await request(`/children/${childId}/photos`, 'GET', otherToken)).json.photos.length, 1);
  assert.equal((await request(`/photos/${photo.json.photo.id}/likes`, 'POST', otherToken)).json.likes.length, 1);
  assert.equal((await request(`/photos/${photo.json.photo.id}/comments`, 'POST', otherToken, { body: '귀여워요' })).json.comment.body, '귀여워요');
  const alerts = await request('/notifications', 'GET', token);
  assert.equal(alerts.json.notifications.length, 3);
  const alertId = alerts.json.notifications[0].id as string;
  assert.equal((await request(`/notifications/${alertId}/read`, 'PATCH', otherToken)).status, 404);
  assert.ok((await request(`/notifications/${alertId}/read`, 'PATCH', token)).json.notification.readAt);
  assert.equal((await request('/me')).status, 401);
});
