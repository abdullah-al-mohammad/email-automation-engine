import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { signup: Mock; signin: Mock };

  beforeEach(() => {
    authService = {
      signup: vi.fn(),
      signin: vi.fn(),
    };
    controller = new AuthController(authService as unknown as typeof controller['authService']);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const response = { accessToken: 'token123' };
      authService.signup.mockResolvedValue(response);

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('signin', () => {
    it('should call authService.signin and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const response = { accessToken: 'token123' };
      authService.signin.mockResolvedValue(response);

      const result = await controller.signin(dto);

      expect(authService.signin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });
});
