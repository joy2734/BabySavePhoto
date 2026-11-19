import { randomBytes } from 'node:crypto';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import { createSession, data, hashPassword, id, publicUser, save, userForToken, verifyPassword, type Care } from './store.js';

const fail = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
const field = (value: unknown, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
const validTime = (value: string) => !!value && !Number.isNaN(Date.parse(value));
const ownsChild = (userId: string, childId: string) => data().children.some((child) => child.id === childId && child.ownerId === userId);
const canViewChild = (userId: string, childId: string) => data().children.some((child) => child.id === childId && (child.ownerId === userId || child.memberIds?.includes(userId)));
const canViewPhoto = (userId: string, photo: { ownerId: string; childId: string; visibility?: string }) => photo.ownerId === userId || (photo.visibility === 'family' && canViewChild(userId, photo.childId));
const notify = (userId: string, childId: string, message: string, photoId?: string) => data().notifications.push({ id: id(), userId, childId, ...(photoId ? { photoId } : {}), message, createdAt: new Date().toISOString() });

export function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:8081').split(',').map((origin) => origin.trim()).filter(Boolean);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '8mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ssukssuk-api', timestamp: new Date().toISOString() }));

  app.post('/api/auth/register', (req, res) => {
    const email = field(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;
    const name = field(req.body?.name, 50);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8 || !name) return fail(res, 400, 'INVALID_INPUT', '이름, 이메일, 8자 이상 비밀번호를 입력해 주세요.');
    if (data().users.some((user) => user.email === email)) return fail(res, 409, 'EMAIL_EXISTS', '이미 사용 중인 이메일입니다.');
    const user = { id: id(), email, name, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    data().users.push(user); save();
    return res.status(201).json({ user: publicUser(user), token: createSession(user.id) });
  });
  app.post('/api/auth/login', (req, res) => {
    const email = field(req.body?.email, 254).toLowerCase();
    const user = data().users.find((item) => item.email === email);
    if (!user || typeof req.body?.password !== 'string' || !verifyPassword(req.body.password, user.passwordHash)) return fail(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해 주세요.');
    return res.json({ user: publicUser(user), token: createSession(user.id) });
  });

  app.use('/api', (req, res, next) => {
    const token = req.header('authorization')?.replace(/^Bearer /i, '');
    const user = userForToken(token);
    if (!user) return fail(res, 401, 'UNAUTHORIZED', '다시 로그인해 주세요.');
    res.locals.user = user; res.locals.token = token; next();
  });
  app.get('/api/me', (_req, res) => res.json({ user: publicUser(res.locals.user) }));
  app.patch('/api/me', (req, res) => {
    const value = req.body?.name;
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 50) return fail(res, 400, 'INVALID_INPUT', '이름은 1~50자로 입력해 주세요.');
    const user = res.locals.user as ReturnType<typeof userForToken>;
    if (!user) return fail(res, 401, 'UNAUTHORIZED', '다시 로그인해 주세요.');
    user.name = value.trim();
    save();
    return res.json({ user: publicUser(user) });
  });
  app.post('/api/auth/logout', (_req, res) => {
    data().sessions = data().sessions.filter((session) => session.token !== res.locals.token);
    save(); res.status(204).end();
  });
  app.get('/api/notifications', (_req, res) => {
    const userId = res.locals.user.id;
    const notifications = data().notifications.filter((item) => {
      if (item.userId !== userId) return false;
      if (!item.photoId) return true;
      const photo = data().photos.find((candidate) => candidate.id === item.photoId);
      return !!photo && canViewPhoto(userId, photo);
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
    return res.json({ notifications });
  });
  app.patch('/api/notifications/:id/read', (req, res) => {
    const notification = data().notifications.find((item) => item.id === req.params.id && item.userId === res.locals.user.id);
    if (!notification) return fail(res, 404, 'NOT_FOUND', '알림을 찾을 수 없습니다.');
    notification.readAt ??= new Date().toISOString();
    save(); return res.json({ notification });
  });

  app.get('/api/children', (_req, res) => res.json({ children: data().children.filter((child) => child.ownerId === res.locals.user.id || child.memberIds?.includes(res.locals.user.id)) }));
  app.post('/api/children', (req, res) => {
    const name = field(req.body?.name, 50), birthDate = field(req.body?.birthDate, 10);
    if (!name || !validDate(birthDate) || Date.parse(birthDate) > Date.now()) return fail(res, 400, 'INVALID_INPUT', '아이 이름과 올바른 생년월일을 입력해 주세요.');
    const child = { id: id(), ownerId: res.locals.user.id, memberIds: [], name, birthDate, createdAt: new Date().toISOString() };
    data().children.push(child); save(); res.status(201).json({ child });
  });
  app.patch('/api/children/:id', (req, res) => {
    const child = data().children.find((item) => item.id === req.params.id && item.ownerId === res.locals.user.id);
    if (!child) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    const name = field(req.body?.name, 50), birthDate = field(req.body?.birthDate, 10);
    if (!name || !validDate(birthDate) || Date.parse(birthDate) > Date.now()) return fail(res, 400, 'INVALID_INPUT', '아이 이름과 올바른 생년월일을 입력해 주세요.');
    child.name = name; child.birthDate = birthDate; save(); return res.json({ child });
  });

  app.post('/api/children/:id/invites', (req, res) => {
    if (!ownsChild(res.locals.user.id, req.params.id)) return fail(res, 403, 'FORBIDDEN', '초대 권한이 없습니다.');
    const code = randomBytes(6).toString('hex').toUpperCase();
    const invite = { code, childId: req.params.id, expiresAt: new Date(Date.now() + 24 * 3600000).toISOString() };
    data().invites.push(invite); save(); return res.status(201).json({ invite });
  });
  app.post('/api/family/join', (req, res) => {
    const code = field(req.body?.code, 20).toUpperCase();
    const invite = data().invites.find((item) => item.code === code && Date.parse(item.expiresAt) > Date.now());
    if (!invite) return fail(res, 400, 'INVALID_INVITE', '초대 코드가 없거나 만료되었습니다.');
    const child = data().children.find((item) => item.id === invite.childId);
    if (!child) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    if (child.ownerId === res.locals.user.id || child.memberIds?.includes(res.locals.user.id)) return fail(res, 409, 'ALREADY_JOINED', '이미 참여한 앨범입니다.');
    (child.memberIds ??= []).push(res.locals.user.id);
    data().invites = data().invites.filter((item) => item.code !== code);
    notify(child.ownerId, child.id, `${res.locals.user.name}님이 ${child.name}의 가족 앨범에 참여했어요.`);
    save(); return res.json({ child });
  });
  app.get('/api/children/:id/members', (req, res) => {
    if (!canViewChild(res.locals.user.id, req.params.id)) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    const child = data().children.find((item) => item.id === req.params.id)!;
    return res.json({ members: data().users.filter((user) => user.id === child.ownerId || child.memberIds?.includes(user.id)).map(publicUser) });
  });

  app.get('/api/children/:id/photos', (req, res) => {
    if (!canViewChild(res.locals.user.id, req.params.id)) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    return res.json({ photos: data().photos.filter((photo) => photo.childId === req.params.id && canViewPhoto(res.locals.user.id, photo)).sort((a, b) => b.takenAt.localeCompare(a.takenAt)) });
  });
  app.post('/api/children/:id/photos', (req, res) => {
    if (!canViewChild(res.locals.user.id, req.params.id)) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    const image = req.body?.dataUri;
    const match = typeof image === 'string' && /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
    if (!match || image.length > 6_000_000) return fail(res, 400, 'INVALID_IMAGE', '6MB 이하 JPEG, PNG 또는 WebP 사진을 선택해 주세요.');
    const bytes = Buffer.from(match[2], 'base64');
    const signature = bytes.subarray(0, 12).toString('hex');
    const validImage = match[1] === 'jpeg' ? signature.startsWith('ffd8ff') : match[1] === 'png' ? signature.startsWith('89504e470d0a1a0a') : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    if (!validImage || bytes.length > 4_500_000) return fail(res, 400, 'INVALID_IMAGE', '사진 파일 형식이나 용량을 확인해 주세요.');
    const takenAt = validTime(req.body?.takenAt) ? new Date(req.body.takenAt).toISOString() : new Date().toISOString();
    const photo = { id: id(), childId: req.params.id, ownerId: res.locals.user.id, dataUri: image, takenAt, caption: field(req.body?.caption, 500), favorite: false, visibility: 'private' as const, likes: [], comments: [], createdAt: new Date().toISOString() };
    data().photos.push(photo); save(); return res.status(201).json({ photo });
  });
  app.patch('/api/photos/:id', (req, res) => {
    const photo = data().photos.find((item) => item.id === req.params.id && item.ownerId === res.locals.user.id);
    if (!photo) return fail(res, 404, 'NOT_FOUND', '사진을 찾을 수 없습니다.');
    if (typeof req.body?.favorite === 'boolean') photo.favorite = req.body.favorite;
    if (typeof req.body?.caption === 'string') photo.caption = field(req.body.caption, 500);
    if (req.body?.visibility === 'private' || req.body?.visibility === 'family') photo.visibility = req.body.visibility;
    save(); return res.json({ photo });
  });
  app.delete('/api/photos/:id', (req, res) => {
    const index = data().photos.findIndex((item) => item.id === req.params.id && item.ownerId === res.locals.user.id);
    if (index < 0) return fail(res, 404, 'NOT_FOUND', '사진을 찾을 수 없습니다.');
    data().photos.splice(index, 1); save(); return res.status(204).end();
  });
  app.post('/api/photos/:id/likes', (req, res) => {
    const photo = data().photos.find((item) => item.id === req.params.id && canViewPhoto(res.locals.user.id, item));
    if (!photo) return fail(res, 404, 'NOT_FOUND', '사진을 찾을 수 없습니다.');
    photo.likes ??= [];
    if (photo.likes.includes(res.locals.user.id)) photo.likes = photo.likes.filter((item) => item !== res.locals.user.id);
    else {
      photo.likes.push(res.locals.user.id);
      if (photo.ownerId !== res.locals.user.id) notify(photo.ownerId, photo.childId, `${res.locals.user.name}님이 사진을 좋아해요.`, photo.id);
    }
    save(); return res.json({ likes: photo.likes });
  });
  app.post('/api/photos/:id/comments', (req, res) => {
    const photo = data().photos.find((item) => item.id === req.params.id && canViewPhoto(res.locals.user.id, item));
    if (!photo) return fail(res, 404, 'NOT_FOUND', '사진을 찾을 수 없습니다.');
    const body = field(req.body?.body, 500);
    if (!body) return fail(res, 400, 'INVALID_INPUT', '댓글을 입력해 주세요.');
    const comment = { id: id(), userId: res.locals.user.id, name: res.locals.user.name, body, createdAt: new Date().toISOString() };
    (photo.comments ??= []).push(comment);
    if (photo.ownerId !== res.locals.user.id) notify(photo.ownerId, photo.childId, `${res.locals.user.name}님이 사진에 댓글을 남겼어요.`, photo.id);
    save(); return res.status(201).json({ comment });
  });

  app.get('/api/children/:id/care', (req, res) => {
    if (!ownsChild(res.locals.user.id, req.params.id)) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    return res.json({ records: data().care.filter((item) => item.childId === req.params.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
  });
  app.post('/api/children/:id/care', (req, res) => {
    if (!ownsChild(res.locals.user.id, req.params.id)) return fail(res, 404, 'NOT_FOUND', '아이를 찾을 수 없습니다.');
    const type: Care['type'] = req.body?.type;
    const startedAt = field(req.body?.startedAt, 40), endedAt = field(req.body?.endedAt, 40), detail = field(req.body?.detail, 50);
    const amountMl = req.body?.amountMl;
    if (!['feeding', 'sleep', 'diaper'].includes(type) || !validTime(startedAt) || (type !== 'diaper' && (!validTime(endedAt) || Date.parse(endedAt) <= Date.parse(startedAt))) || (type === 'diaper' && !detail) || (amountMl !== undefined && (!Number.isFinite(amountMl) || amountMl < 0 || amountMl > 3000))) return fail(res, 400, 'INVALID_INPUT', '기록 종류, 시간, 수유량을 확인해 주세요.');
    if (data().care.some((item) => item.childId === req.params.id && item.type === type && item.startedAt === new Date(startedAt).toISOString())) return fail(res, 409, 'DUPLICATE', '같은 시간의 기록이 이미 있습니다.');
    if (type === 'sleep' && data().care.some((item) => item.childId === req.params.id && item.type === 'sleep' && Date.parse(startedAt) < Date.parse(item.endedAt ?? item.startedAt) && Date.parse(endedAt) > Date.parse(item.startedAt))) return fail(res, 409, 'OVERLAP', '겹치는 수면 기록이 있습니다.');
    const record: Care = { id: id(), ownerId: res.locals.user.id, childId: req.params.id, type, startedAt: new Date(startedAt).toISOString(), ...(type !== 'diaper' ? { endedAt: new Date(endedAt).toISOString() } : {}), detail, ...(amountMl !== undefined ? { amountMl } : {}), memo: field(req.body?.memo, 500), createdAt: new Date().toISOString() };
    data().care.push(record); save(); return res.status(201).json({ record });
  });
  app.delete('/api/care/:id', (req, res) => {
    const index = data().care.findIndex((item) => item.id === req.params.id && item.ownerId === res.locals.user.id);
    if (index < 0) return fail(res, 404, 'NOT_FOUND', '기록을 찾을 수 없습니다.');
    data().care.splice(index, 1); save(); return res.status(204).end();
  });

  app.use((_req, res) => fail(res, 404, 'NOT_FOUND', '요청한 주소를 찾을 수 없습니다.'));
  app.use((error: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    if ('type' in error && error.type === 'entity.too.large') return fail(res, 413, 'TOO_LARGE', '사진 용량이 너무 큽니다.');
    if ('type' in error && error.type === 'entity.parse.failed') return fail(res, 400, 'INVALID_JSON', '요청 형식을 확인해 주세요.');
    console.error(error); return fail(res, 500, 'INTERNAL_ERROR', '서버 오류가 발생했습니다.');
  });
  return app;
}
