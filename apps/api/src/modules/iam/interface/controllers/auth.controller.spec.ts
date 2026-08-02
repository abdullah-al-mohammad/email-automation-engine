import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { signup: Mock; signin: Mock; getMe: Mock };

  beforeEach(() => {
    authService = {
      signup: vi.fn(),
      signin: vi.fn(),
      getMe: vi.fn(),
    };
    controller = new AuthController(authService as unknown as (typeof controller)['authService']);
  });

  it('is instantiable', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('forwards signup to the auth service', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const response = { accessToken: 'token123' };
      authService.signup.mockResolvedValue(response);

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('signin', () => {
    it('forwards signin to the auth service', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const response = { accessToken: 'token123' };
      authService.signin.mockResolvedValue(response);

      const result = await controller.signin(dto);

      expect(authService.signin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('getMe', () => {
    it('forwards getMe to the auth service', async () => {
      const response = {
        id: 'u1',
        email: 'test@example.com',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      authService.getMe.mockResolvedValue(response);

      const result = await controller.getMe({ id: 'u1' });

      expect(authService.getMe).toHaveBeenCalledWith('u1');
      expect(result).toEqual(response);
    });
  });
});
