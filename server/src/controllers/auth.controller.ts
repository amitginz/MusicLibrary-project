import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { env } from '../config/env';
import { AuthRequest } from '../types';

const registerSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  password: z.string().min(6),
  photoUrl: z.string().optional().default(''),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const existing = await User.findOne({ username: body.username.toLowerCase() });
  if (existing) {
    res.status(409).json({ message: 'Username already exists' });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);
  await User.create({ ...body, password: hashedPassword });
  res.status(201).json({ message: 'Registration successful' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ username: body.username.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const payload = { id: user._id.toString(), username: user.username, firstName: user.firstName, photoUrl: user.photoUrl };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  res.json({ success: true, token, user: payload });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user._id, username: user.username, firstName: user.firstName, photoUrl: user.photoUrl });
}
