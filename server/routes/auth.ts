import { Router } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();
const demoUser = { id: 'student-demo', name: 'Mia', role: 'student', grade: '6' };

authRouter.post('/login', (req, res) => {
  const token = jwt.sign({ sub: demoUser.id, role: req.body.role || 'student' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token, user: { ...demoUser, role: req.body.role || 'student' } });
});

authRouter.post('/register', (req, res) => {
  const token = jwt.sign({ sub: 'new-student', role: 'student' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: 'new-student', name: req.body.name, role: 'student', grade: req.body.grade } });
});
