import { type HealthResponse } from '@email-automation-engine/shared';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
    };
  }
}
