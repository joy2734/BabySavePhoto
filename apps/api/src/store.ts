import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type User = { id: string; email: string; name: string; passwordHash: string; createdAt: string };
export type Child = { id: string; ownerId: string; memberIds: string[]; name: string; birthDate: string; createdAt: string };
export type Comment = { id: string; userId: string; name: string; body: string; createdAt: string };
export type Photo = { id: string; childId: string; ownerId: string; dataUri: string; takenAt: string; caption: string; favorite: boolean; visibility: 'private' | 'family'; likes: string[]; comments: Comment[]; createdAt: string };
export type Care = { id: string; childId: string; ownerId: string; type: 'feeding' | 'sleep' | 'diaper'; startedAt: string; endedAt?: string; detail: string; amountMl?: number; memo: string; createdAt: string };
type Session = { token: string; userId: string; expiresAt: string };
export type Invite = { code: string; childId: string; expiresAt: string };
export type Notification = { id: string; userId: string; childId: string; photoId?: string; message: string; createdAt: string; readAt?: string };
type Database = { users: User[]; children: Child[]; photos: Photo[]; care: Care[]; sessions: Session[]; invites: Invite[]; notifications: Notification[] };

const file = resolve(process.env.DATA_FILE ?? 'data/app.json');
const empty = (): Database => ({ users: [], children: [], photos: [], care: [], sessions: [], invites: [], notifications: [] });
let db: Database;
try { db = { ...empty(), ...JSON.parse(readFileSync(file, 'utf8')) }; } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  db = empty();
}

export function data() { return db; }
export function save() {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(db), { mode: 0o600 });
  renameSync(temporary, file);
}
export function id() { return randomUUID(); }
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBytes = Buffer.from(expected, 'hex');
  return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
}
export function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  db.sessions.push({ token, userId, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() });
  save();
  return token;
}
export function userForToken(token: string | undefined) {
  const session = db.sessions.find((item) => item.token === token && Date.parse(item.expiresAt) > Date.now());
  return session && db.users.find((user) => user.id === session.userId);
}
export function publicUser(user: User) { return { id: user.id, email: user.email, name: user.name }; }
