# Auth and Permissions

Authentication is intentionally small in the first release. Tenant access is permission-based and built around configurable roles.

## Goals

- Users can sign up and sign in.
- Users can create tenants.
- Users can belong to multiple tenants.
- The tenant creator is tracked on the tenant record.
- Each tenant membership has a role assigned from tenant-defined roles.
- API routes can require authentication and tenant-level permissions.
- Frontend routes and actions can hide or block features based on the user's tenant role.
- Roles are built from a modular permission catalog.
- Tenant setup creates a full-permission role for the creator.
- Authorization must never depend on hardcoded role names.

## Authentication Model

Use simple user-based authentication.

Initial capabilities:

- Sign up.
- Sign in.
- Get current user.
- Sign out.
- Reset password.
- Invitation-based signup or tenant join.

Recommended token model:

- Signed token.
- Token metadata must support invalidation after password change.
- Keep secrets in environment variables.
- Do not store raw tokens.

Do not include social login, two-factor authentication, device verification, or advanced session intelligence in the first release.

## Tenant Membership

Use a join table between users and tenants. Memberships should reference a role record, not a hardcoded role string.

Suggested table:

```text
tenantMemberships
```

Suggested fields:

- `id`
- `tenantId`
- `userId`
- `roleId`
- `status`
- `createdAt`
- `updatedAt`

Suggested membership statuses:

- `active`
- `blocked`

## Tenant Creator

The tenant record stores the creator user ID. This avoids a separate root flag on memberships while preserving a clear ownership model.

Creator behavior:

- The creator still has a normal tenant membership and role.
- The creator receives the initial full-permission role during tenant creation.
- The creator can recover or reconfigure roles, permissions, memberships, and tenant ownership settings if role permissions are misconfigured.
- Creator-level recovery is limited to tenant access recovery and tenant administration.
- Creator-level recovery does not bypass unrelated runtime validation such as workflow activation rules, tenant ownership checks, or input validation.
- A tenant must always have a valid creator user.
- Transferring tenant creator ownership should require the current creator.

## Roles

Roles are tenant-scoped records built from the permission catalog. The first tenant role has every permission so the creator can manage the tenant immediately.

Do not hardcode authorization to a fixed role name such as owner, editor, or viewer. The initial full-permission role is only data. Permission checks must still use the role's assigned permissions.

Suggested table:

```text
roles
```

Suggested fields:

- `id`
- `tenantId`
- `name`
- `slug`
- `description`
- `createdAt`
- `updatedAt`

Authorization logic must work with any tenant-created role. Controllers, guards, services, and frontend checks must rely on permissions, not role names or slugs.

## Modular Permissions

Do not hardcode authorization as role-name checks inside controllers. Define a complete permission catalog and assign permissions to roles through a mapping table.

Suggested table:

```text
rolePermissions
```

Suggested fields:

- `id`
- `roleId`
- `permission`
- `createdAt`
- `updatedAt`

Example permissions:

```text
tenant.read
tenant.update
members.read
members.manage
contacts.read
contacts.manage
tags.manage
workflows.read
workflows.manage
workflows.activate
templates.read
templates.manage
settings.manage
reports.read
```

The role management UI shows the full permission catalog grouped by module. Users can keep the initial full-permission role, clone it, reduce permissions, or create narrower custom roles.

Suggested permission modules:

```text
tenant
members
contacts
tags
workflows
templates
settings
reports
```

Tenant setup creates an initial full-permission role for the creator. The role can use a normal display name such as "Full Access", but the implementation must never check this role by name.

## Tenant Invitations

Tenant invitations are part of multi-tenant permission management.

Suggested table:

```text
tenantInvitations
```

Suggested fields:

- `id`
- `tenantId`
- `senderId`
- `roleId`
- `email`
- `invitationToken`
- `message`
- `createdAt`
- `updatedAt`

Required flows:

- List tenant invitations.
- Create invitation.
- View invitation by token.
- Accept invitation.
- Reject invitation.
- Resend invitation.
- Cancel invitation.

Invitation tokens must not be returned in normal list responses.

## Backend Guards

NestJS provides:

- `AuthGuard`: verifies signed-in user.
- `TenantMembershipGuard`: verifies the user belongs to the tenant.
- `PermissionsGuard`: checks required permissions.
- `@RequirePermissions(...)` decorator.
- `@CurrentUser()` decorator.
- `@CurrentTenant()` or resolved tenant context.

Backend authorization must always be enforced server-side. Frontend checks are only for user experience.

## NestJS Implementation Pattern

Follow the project's NestJS style:

- Domain aggregate classes use camelCase properties.
- TypeORM maps to snake_case database columns through `SnakeNamingStrategy`.
- Repository interfaces live in `domain/repositories`.
- TypeORM implementations live in `infrastructure/repositories`.
- Injection tokens are symbols in `constants/tokens.ts`.
- Controllers use guards and decorators; application services hold business logic.

## Frontend Permission Use

The frontend receives the user's current tenant role and permissions with tenant context.

Tenant context also includes whether the current user is the tenant creator so the UI can show recovery and administration controls only where appropriate. Normal feature access still renders from permissions.

Use permissions to:

- Protect routes.
- Hide unavailable actions.
- Disable controls.
- Show read-only workflow builder state when the current role lacks workflow management permissions.

Do not rely on frontend permission checks for security.

## Tenant Creation

Users can create tenants from the UI. Tenant creation must also create the creator's first role and membership.

Tenant creation:

- Create tenant.
- Create an initial tenant-scoped role with all available permissions.
- Create role-permission mappings for that initial role.
- Create membership for creator with that role.
- Set the created tenant as current tenant in the frontend.

Role management:

- List all roles in the tenant.
- Show each role's assigned permissions.
- Show the full permission catalog grouped by module.
- Allow creating roles from scratch.
- Allow cloning the full-permission role and removing permissions.
- Prevent removing or blocking the tenant creator's last active membership.
- Prevent removing every role path that can manage tenant roles unless creator recovery remains available.

## Public Repository Safety

- Use product-neutral names: user, tenant, membership, role, permission.
- Do not include private auth code.
- Do not include private email templates, messages, URLs, or token secrets.
- Use tests to preserve required behavior.
