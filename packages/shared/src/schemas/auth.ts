import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type SignupDto = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SigninDto = z.infer<typeof signinSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
