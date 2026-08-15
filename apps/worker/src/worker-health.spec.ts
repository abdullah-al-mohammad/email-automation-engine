import { describe, expect, it } from 'vitest';

import { getWorkerHealth } from './worker-health';

describe('getWorkerHealth', () => {
  it('returns worker health', () => {
    expect(getWorkerHealth()).toEqual({
      status: 'ok',
      service: 'worker',
    });
  });
});
