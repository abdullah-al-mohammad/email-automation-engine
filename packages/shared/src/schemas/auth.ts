import { z } from 'zod';

import { USER_STATUSES } from '../constants/user-status.constants';

const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const signupSchema = z.object({
  email: emailField,
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type SignupDto = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: emailField,
  // Sign-in only requires a non-empty password so validation rules aren't leaked
  password: z.string().min(1, 'Password is required'),
});

export type SigninDto = z.infer<typeof signinSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(USER_STATUSES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
