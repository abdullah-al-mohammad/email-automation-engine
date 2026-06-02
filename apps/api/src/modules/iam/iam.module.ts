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
  ENCRYPTION_SERVICE,
} from './constants/tokens';
import { TypeOrmUserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { TypeOrmTenantRepository } from './infrastructure/repositories/typeorm-tenant.repository';
import { TypeOrmRoleRepository } from './infrastructure/repositories/typeorm-role.repository';
import { TypeOrmTenantMembershipRepository } from './infrastructure/repositories/typeorm-tenant-membership.repository';

import { EncryptionService } from './infrastructure/security/encryption.service';
import { AuthService } from './application/services/auth.service';
import { TenantService } from './application/services/tenant.service';

import { AuthController } from './interface/controllers/auth.controller';
import { TenantController } from './interface/controllers/tenant.controller';
import { JWT_SECRET } from '../../infrastructure/config/config-keys';

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
  ],
  controllers: [AuthController, TenantController],
  providers: [
    AuthService,
    TenantService,
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
      provide: ENCRYPTION_SERVICE,
      useClass: EncryptionService,
    },
  ],
  exports: [
    AuthService,
    TenantService,
    USER_REPOSITORY,
    TENANT_REPOSITORY,
    ROLE_REPOSITORY,
    TENANT_MEMBERSHIP_REPOSITORY,
    ENCRYPTION_SERVICE,
    JwtModule,
  ],
})
export class IamModule {}
