import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";
import { AppError } from "../utils/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  if (!secret) throw new Error("JWT_SECRET missing");

  return jwt.sign({}, secret, { subject: userId.toString(), expiresIn });
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation error", 400, parsed.error.flatten());

  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id);

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
    token
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation error", 400, parsed.error.flatten());

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = signToken(user._id);

  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    token
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("_id name email createdAt");
  if (!user) throw new AppError("User not found", 404);
  res.json({ user });
});
