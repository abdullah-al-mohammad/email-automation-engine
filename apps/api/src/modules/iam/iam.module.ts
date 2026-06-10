import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from './domain/aggregates/user.aggregate';
import { Tenant } from './domain/aggregates/tenant.aggregate';
import { Role } from './domain/aggregates/role.aggregate';
import { RolePermission } from './domain/aggregates/role-permission.aggregate';
import { TenantMembership } from './domain/aggregates/tenant-membership.aggregate';

import {
  USER_REPOSITORY,
  TENANT_REPOSITORY,
  ROLE_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  TENANT_INVITATION_REPOSITORY,
  ENCRYPTION_SERVICE,
} from './constants/tokens';
import { TypeOrmUserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { TypeOrmTenantRepository } from './infrastructure/repositories/typeorm-tenant.repository';
import { TypeOrmRoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmTenantMembershipRepository } from './infrastructure/repositories/typeorm-tenant-membership.repository';

import { EncryptionService } from './infrastructure/security/encryption.service';
import { AuthService } from './application/services/auth.service';
import { TenantService } from './application/services/tenant.service';
import { RoleService } from './application/services/role.service';
import { TenantMemberService } from './application/services/tenant-member.service';
import { TenantInvitationService } from './application/services/tenant-invitation.service';

import { AuthController } from './interface/controllers/auth.controller';
import { TenantController } from './interface/controllers/tenant.controller';
import { RoleController } from './interface/controllers/role.controller';
import { TenantMemberController } from './interface/controllers/tenant-member.controller';
import { TenantInvitationController } from './interface/controllers/tenant-invitation.controller';
import { JWT_SECRET } from '../../infrastructure/config/config-keys';
import { TenantInvitation } from './domain/aggregates/tenant-invitation.aggregate';
import { TypeOrmTenantInvitationRepository } from './infrastructure/repositories/typeorm-tenant-invitation.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Role, RolePermission, TenantMembership]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(JWT_SECRET),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    TypeOrmModule.forFeature([TenantInvitation]),
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
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: TENANT_REPOSITORY,
      useClass: TypeOrmTenantRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: TypeOrmRoleRepository,
    },
    {
      provide: TENANT_MEMBERSHIP_REPOSITORY,
      useClass: TypeOrmTenantMembershipRepository,
    },
    {
      provide: TENANT_INVITATION_REPOSITORY,
      useClass: TypeOrmTenantInvitationRepository,
    },
    {
      provide: ENCRYPTION_SERVICE,
      useClass: EncryptionService,
    },
  ],
  exports: [
    AuthService,
    TenantService,
    RoleService,
    USER_REPOSITORY,
    TENANT_REPOSITORY,
    ROLE_REPOSITORY,
    TENANT_MEMBERSHIP_REPOSITORY,
    TENANT_INVITATION_REPOSITORY,
    ENCRYPTION_SERVICE,
    JwtModule,
  ],
})
export class IamModule {}
