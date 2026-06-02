import { z } from 'zod';

export const permissionsCatalog = [
  'tenant.read',
  'tenant.update',
  'members.read',
  'members.manage',
  'contacts.read',
  'contacts.manage',
  'tags.manage',
  'workflows.read',
  'workflows.manage',
  'workflows.activate',
  'templates.read',
  'templates.manage',
  'settings.manage',
  'reports.read',
] as const;

export type Permission = (typeof permissionsCatalog)[number];

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name is too long'),
  description: z.string().max(255).optional().nullable(),
  permissions: z.array(z.enum(permissionsCatalog)).min(1, 'At least one permission is required'),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  permissions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoleResponse = z.infer<typeof roleResponseSchema>;
