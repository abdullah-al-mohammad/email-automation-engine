import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Tenant } from '../../domain/aggregates/tenant.aggregate';
import { type TenantRepository } from '../../domain/repositories/tenant.repository';

@Injectable()
export class TypeOrmTenantRepository implements TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Tenant[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  async save(tenant: Tenant): Promise<Tenant> {
    return this.repo.save(tenant);
  }

  async findByCreatorId(creatorId: string): Promise<Tenant[]> {
    return this.repo.find({ where: { creatorId } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
