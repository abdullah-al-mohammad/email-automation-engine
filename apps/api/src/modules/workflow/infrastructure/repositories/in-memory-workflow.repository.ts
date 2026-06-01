import { Injectable } from '@nestjs/common';
import { type WorkflowRepository } from '../../domain/repositories/workflow.repository';

@Injectable()
export class InMemoryWorkflowRepository implements WorkflowRepository {
  exists(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
