import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../auth/middleware';
import { createSessionToken, hashPassword, verifyPassword } from '../auth/session';
import { AuthenticatedUser, PROTOCOL_ROLES, ProtocolRole } from '../auth/types';

const router = Router();
const attempts = new Map<string, { count: number; startedAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function publicUser(record: any): AuthenticatedUser {
  return {
    id: record.id,
    loginId: record.login_id,
    displayName: record.display_name,
    organization: record.organization,
    role: record.role as ProtocolRole,
    walletAddress: record.wallet_address || null
  };
}

function requiredAccessCode(role: ProtocolRole): string | null {
  if (role === 'INDEPENDENT_VERIFIER') {
    return process.env.VERIFIER_SIGNUP_CODE || (process.env.NODE_ENV === 'production' ? null : 'VERIFIER-2026');
  }
  if (role === 'REGULATOR_AUDITOR') {
    return process.env.AUDITOR_SIGNUP_CODE || (process.env.NODE_ENV === 'production' ? null : 'AUDITOR-2026');
  }
  return '';
}

router.post('/signup', async (req: Request, res: Response) => {
  const loginId = String(req.body?.loginId || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const displayName = String(req.body?.displayName || '').trim() || loginId;
  const organization = String(req.body?.organization || '').trim() || 'Carbonyx Network';
  const role = (String(req.body?.role || '') as ProtocolRole) || 'PROJECT_PROPONENT';
  const accessCode = String(req.body?.accessCode || '').trim();

  if (!loginId || loginId.length < 2) {
    return res.status(400).json({ error: 'User ID must be at least 2 characters' });
  }
  if (!PROTOCOL_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Select a valid protocol role' });
  }
  if (!password || password.length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' });
  }

  const requiredCode = requiredAccessCode(role);
  const restrictedRole = role === 'INDEPENDENT_VERIFIER' || role === 'REGULATOR_AUDITOR';
  if (restrictedRole && !requiredCode) {
    return res.status(503).json({ error: 'Accredited-role signup is not configured' });
  }
  if (requiredCode && accessCode !== requiredCode) {
    return res.status(403).json({ error: 'Invalid accreditation access code' });
  }

  try {
    const { data: existing, error: lookupError } = await supabase
      .from('app_users')
      .select('id')
      .eq('login_id', loginId)
      .maybeSingle();

    if (lookupError) {
      console.error('[Auth] Unable to read app_users:', lookupError.message);
      return res.status(503).json({ error: 'Authentication database is not initialized. Apply the app_users RBAC migration.' });
    }
    if (existing) {
      return res.status(409).json({ error: 'This Carbonyx user ID is already registered' });
    }

    const passwordRecord = hashPassword(password);
    const { data: record, error: insertError } = await supabase
      .from('app_users')
      .insert({
        login_id: loginId,
        display_name: displayName,
        organization,
        role,
        password_salt: passwordRecord.salt,
        password_hash: passwordRecord.hash,
        is_active: true
      })
      .select('id, login_id, display_name, organization, role, wallet_address')
      .single();

    if (insertError || !record) {
      if (insertError?.code === '23505') {
        return res.status(409).json({ error: 'This Carbonyx user ID is already registered' });
      }
      throw new Error(insertError?.message || 'Unable to create identity');
    }

    const user = publicUser(record);
    return res.status(201).json({ token: createSessionToken(user), user, expiresIn: 8 * 60 * 60 });
  } catch (error: any) {
    console.error('[Auth] Signup failed:', error.message);
    return res.status(500).json({ error: 'Unable to create your Carbonyx identity' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const loginId = String(req.body?.loginId || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const attemptKey = `${req.ip}:${loginId}`;
  const now = Date.now();
  const attempt = attempts.get(attemptKey);

  if (attempt && now - attempt.startedAt < ATTEMPT_WINDOW_MS && attempt.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  }

  if (!loginId || !password || loginId.length > 80 || password.length > 200) {
    return res.status(400).json({ error: 'A valid user ID and password are required' });
  }

  try {
    const { data: record, error } = await supabase
      .from('app_users')
      .select('id, login_id, display_name, organization, role, wallet_address, password_salt, password_hash, is_active')
      .eq('login_id', loginId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Unable to read app_users:', error.message);
      return res.status(503).json({
        error: 'Authentication database is not initialized. Apply the app_users RBAC migration.'
      });
    }

    const valid = record?.is_active && verifyPassword(password, record.password_salt, record.password_hash);
    if (!valid) {
      attempts.set(attemptKey, {
        count: attempt && now - attempt.startedAt < ATTEMPT_WINDOW_MS ? attempt.count + 1 : 1,
        startedAt: attempt && now - attempt.startedAt < ATTEMPT_WINDOW_MS ? attempt.startedAt : now
      });
      return res.status(401).json({ error: 'Invalid user ID or password' });
    }

    attempts.delete(attemptKey);
    const user = publicUser(record);
    await supabase.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', record.id);
    return res.json({ token: createSessionToken(user), user, expiresIn: 8 * 60 * 60 });
  } catch (error: any) {
    console.error('[Auth] Login failed:', error.message);
    return res.status(500).json({ error: 'Authentication service is unavailable' });
  }
});

router.get('/session', authenticate, (_req: Request, res: Response) => {
  const { iat: _iat, exp: _exp, ...user } = res.locals.auth;
  return res.json({ user });
});

router.post('/logout', authenticate, (_req: Request, res: Response) => {
  return res.status(204).send();
});

export default router;
