import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AuthenticatedUser, PROTOCOL_ROLES, SessionPayload } from './types';

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEV_SESSION_SECRET = 'carbonyx-local-development-secret-change-before-deploying';

function getSessionSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET || DEV_SESSION_SECRET;
  if (process.env.NODE_ENV === 'production' && secret === DEV_SESSION_SECRET) {
    throw new Error('AUTH_TOKEN_SECRET must be configured in production');
  }
  return secret;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(unsignedToken: string): string {
  return createHmac('sha256', getSessionSecret()).update(unsignedToken).digest('base64url');
}

export function createSessionToken(user: AuthenticatedUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'CBX' });
  const payload = encode({ ...user, iat: now, exp: now + SESSION_TTL_SECONDS });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra) return null;

    const supplied = Buffer.from(signature, 'base64url');
    const expected = Buffer.from(sign(`${header}.${payload}`), 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload;
    if (!session.id || !session.loginId || !PROTOCOL_ROLES.includes(session.role)) return null;
    if (!Number.isFinite(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computed = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, 'hex');
    return computed.length === expected.length && timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString('hex')
  };
}
