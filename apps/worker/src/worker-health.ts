import { type HealthResponse } from '@email-automation-engine/shared';

export function getWorkerHealth(): HealthResponse {
  return {
    status: 'ok',
    service: 'worker',
  };
}
