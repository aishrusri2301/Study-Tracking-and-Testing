import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import { findUserByEmail, upsertUser } from '../services/store';

export const authRouter = Router();

function hashPassword(password: string) {
  return crypto
    .createHash('sha256')
    .update(
      `${process.env.JWT_SECRET || 'dev-secret'}:${password}`
    )
    .digest('hex');
}

function tokenFor(id: string, role: string) {
  return jwt.sign(
    {
      sub: id,
      role,
    },
    process.env.JWT_SECRET || 'dev-secret',
    {
      expiresIn: '7d',
    }
  );
}

authRouter.post('/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();

  const password = String(req.body.password || '');

  const user = await findUserByEmail(email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  return res.json({
    token: tokenFor(user.id, user.role),

    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade,
      board: user.board,
    },
  });
});

authRouter.post('/register', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();

  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  const user = await upsertUser({
    email,
    passwordHash: hashPassword(password),
    name: String(req.body.name || email.split('@')[0]),
    role: req.body.role === 'parent'
      ? 'parent'
      : 'student',
    grade: req.body.grade,
    board: req.body.board,
  });

  return res.status(201).json({
    token: tokenFor(user.id, user.role),

    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade,
      board: user.board,
    },
  });
});