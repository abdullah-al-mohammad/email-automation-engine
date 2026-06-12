import { z } from 'zod';

export const tenantMemberResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  status: z.string(),
  user: z.object({ email: z.string() }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TenantMemberResponse = z.infer<typeof tenantMemberResponseSchema>;

export const tenantInvitationResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  senderId: z.string(),
  roleId: z.string(),
  email: z.string().email(),
  invitationToken: z.string(),
  message: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TenantInvitationResponse = z.infer<typeof tenantInvitationResponseSchema>;

export const createTenantInvitationSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
  message: z.string().optional(),
});

export type CreateTenantInvitationDto = z.infer<typeof createTenantInvitationSchema>;
