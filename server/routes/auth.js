import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db from '../lib/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'statsbudget-dev-secret-change-in-production';
const JWT_EXPIRES = '30d';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Ikke autoriseret' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Ugyldig eller udløbet token' });
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ error: 'Email, navn og adgangskode er påkrævet' });
  if (password.length < 8) return res.status(400).json({ error: 'Adgangskode skal være mindst 8 tegn' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Ugyldig email-adresse' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const stmt = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)');
    const result = stmt.run(email.toLowerCase().trim(), name.trim(), hash);
    const token = signToken(result.lastInsertRowid);
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email: email.toLowerCase().trim(), name: name.trim() } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email-adressen er allerede registreret' });
    console.error('[auth] register error:', err.message);
    res.status(500).json({ error: 'Intern fejl' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Forkert email eller adgangskode' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Forkert email eller adgangskode' });

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Bruger ikke fundet' });
  res.json({ user });
});

// GET /api/auth/solutions
router.get('/solutions', requireAuth, (req, res) => {
  const solutions = db.prepare(
    'SELECT id, title, description, is_public, share_token, created_at, updated_at FROM solutions WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.userId);
  res.json({ solutions });
});

// POST /api/auth/solutions
router.post('/solutions', requireAuth, (req, res) => {
  const { title, description, state, isPublic } = req.body || {};
  if (!title || !state) return res.status(400).json({ error: 'Titel og budgetdata er påkrævet' });

  const share_token = isPublic ? crypto.randomBytes(8).toString('hex') : null;
  const stmt = db.prepare(
    'INSERT INTO solutions (user_id, title, description, state_json, is_public, share_token) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(req.userId, title.trim(), (description || '').trim(), JSON.stringify(state), isPublic ? 1 : 0, share_token);
  res.status(201).json({ id: result.lastInsertRowid, share_token });
});

// PUT /api/auth/solutions/:id
router.put('/solutions/:id', requireAuth, (req, res) => {
  const { title, description, state, isPublic } = req.body || {};
  const existing = db.prepare('SELECT id FROM solutions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Løsning ikke fundet' });

  const share_token = isPublic ? (db.prepare('SELECT share_token FROM solutions WHERE id = ?').get(req.params.id).share_token || crypto.randomBytes(8).toString('hex')) : null;
  db.prepare(
    'UPDATE solutions SET title = ?, description = ?, state_json = ?, is_public = ?, share_token = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
  ).run(title.trim(), (description || '').trim(), JSON.stringify(state), isPublic ? 1 : 0, share_token, req.params.id, req.userId);
  res.json({ ok: true, share_token });
});

// DELETE /api/auth/solutions/:id
router.delete('/solutions/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM solutions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Løsning ikke fundet' });
  res.json({ ok: true });
});

// GET /api/auth/solutions/shared/:token — public, no auth
router.get('/solutions/shared/:token', (req, res) => {
  const sol = db.prepare(
    'SELECT s.title, s.description, s.state_json, s.created_at, u.name as author FROM solutions s JOIN users u ON u.id = s.user_id WHERE s.share_token = ? AND s.is_public = 1'
  ).get(req.params.token);
  if (!sol) return res.status(404).json({ error: 'Delt løsning ikke fundet' });
  res.json({ ...sol, state: JSON.parse(sol.state_json) });
});

export default router;
