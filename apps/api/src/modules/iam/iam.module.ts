import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JWT_EXPIRES_IN, JWT_SECRET } from '../../infrastructure/config/config-keys';

import { Role } from './domain/aggregates/role.aggregate';
import { RolePermission } from './domain/aggregates/role-permission.aggregate';
import { Tenant } from './domain/aggregates/tenant.aggregate';
import { TenantInvitation } from './domain/aggregates/tenant-invitation.aggregate';
import { TenantMembership } from './domain/aggregates/tenant-membership.aggregate';
import { User } from './domain/aggregates/user.aggregate';

import {
  ENCRYPTION_SERVICE,
  PASSWORD_HASHER,
  ROLE_REPOSITORY,
  TENANT_INVITATION_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from './constants/tokens';

import { TypeOrmRoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmTenantInvitationRepository } from './infrastructure/repositories/typeorm-tenant-invitation.repository';
import { TypeOrmTenantMembershipRepository } from './infrastructure/repositories/typeorm-tenant-membership.repository';
import { TypeOrmTenantRepository } from './infrastructure/repositories/typeorm-tenant.repository';
import { TypeOrmUserRepository } from './infrastructure/repositories/typeorm-user.repository';

import { EncryptionService } from './infrastructure/security/encryption.service';
import { PasswordHasher } from './infrastructure/security/password-hasher.service';
import { TokenService } from './infrastructure/security/token.service';

import { AuthService } from './application/services/auth.service';
import { RoleService } from './application/services/role.service';
import { TenantInvitationService } from './application/services/tenant-invitation.service';
import { TenantMemberService } from './application/services/tenant-member.service';
import { TenantService } from './application/services/tenant.service';

import { AuthController } from './interface/controllers/auth.controller';
import { RoleController } from './interface/controllers/role.controller';
import { TenantController } from './interface/controllers/tenant.controller';
import { TenantInvitationController } from './interface/controllers/tenant-invitation.controller';
import { TenantMemberController } from './interface/controllers/tenant-member.controller';

import { AuthGuard } from './interface/guards/auth.guard';
import { PermissionsGuard } from './interface/guards/permissions.guard';
import { TenantMembershipGuard } from './interface/guards/tenant-membership.guard';

const useClassProviders: Provider<unknown>[] = (
  [
    [USER_REPOSITORY, TypeOrmUserRepository],
    [TENANT_REPOSITORY, TypeOrmTenantRepository],
    [ROLE_REPOSITORY, TypeOrmRoleRepository],
    [TENANT_MEMBERSHIP_REPOSITORY, TypeOrmTenantMembershipRepository],
    [TENANT_INVITATION_REPOSITORY, TypeOrmTenantInvitationRepository],
    [ENCRYPTION_SERVICE, EncryptionService],
    [PASSWORD_HASHER, PasswordHasher],
    [TOKEN_SERVICE, TokenService],
  ] as const
).map(([provide, useClass]) => ({ provide, useClass }));

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Tenant,
      Role,
      RolePermission,
      TenantMembership,
      TenantInvitation,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(JWT_SECRET),
        signOptions: { expiresIn: JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [
    AuthController,
    TenantController,
    RoleController,
    TenantMemberController,
    TenantInvitationController,
  ],
  providers: [
    AuthService,
    TenantService,
    RoleService,
    TenantMemberService,
    TenantInvitationService,
    AuthGuard,
    TenantMembershipGuard,
    PermissionsGuard,
    ...useClassProviders,
  ],
  exports: [
    TOKEN_SERVICE,
    TENANT_REPOSITORY,
    ROLE_REPOSITORY,
    TENANT_MEMBERSHIP_REPOSITORY,
    AuthGuard,
    TenantMembershipGuard,
    PermissionsGuard,
  ],
})
export class IamModule {}
