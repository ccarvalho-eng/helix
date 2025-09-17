import { AuthService, LoginInput, RegisterInput } from '../auth';
import { client } from '../../../lib/apollo';

// Mock Apollo client
jest.mock('../../../lib/apollo', () => ({
  client: {
    query: jest.fn(),
    mutate: jest.fn(),
    clearStore: jest.fn(),
  },
}));

const mockClient = client as jest.Mocked<typeof client>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear authentication state
    AuthService.logout();
  });

  describe('checkAuth', () => {
    it('returns user when authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockClient.query.mockResolvedValueOnce({
        data: { me: mockUser },
      });

      const result = await AuthService.checkAuth();

      expect(result).toEqual(mockUser);
      expect(AuthService.isAuthenticated()).toBe(true);
      expect(AuthService.getCurrentUser()).toEqual(mockUser);
    });

    it('returns null when not authenticated', async () => {
      mockClient.query.mockResolvedValueOnce({
        data: { me: null },
      });

      const result = await AuthService.checkAuth();

      expect(result).toBeNull();
      expect(AuthService.isAuthenticated()).toBe(false);
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    it('handles errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Network error'));

      const result = await AuthService.checkAuth();

      expect(result).toBeNull();
      expect(AuthService.isAuthenticated()).toBe(false);
      expect(AuthService.getCurrentUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          login: {
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
            token: 'jwt-token',
          },
        },
      };

      mockClient.mutate.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login(loginInput);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('jwt-token');
      expect(AuthService.isAuthenticated()).toBe(true);
      expect(AuthService.getCurrentUser()?.email).toBe('test@example.com');
    });

    it('throws error when login fails', async () => {
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      mockClient.mutate.mockResolvedValueOnce({
        data: { login: null },
      });

      await expect(AuthService.login(loginInput)).rejects.toThrow('Login failed');
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('register', () => {
    it('successfully registers user', async () => {
      const registerInput: RegisterInput = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockResponse = {
        data: {
          register: {
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
            token: 'jwt-token',
          },
        },
      };

      mockClient.mutate.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.register(registerInput);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('jwt-token');
      expect(AuthService.isAuthenticated()).toBe(true);
      expect(AuthService.getCurrentUser()?.email).toBe('test@example.com');
    });

    it('throws error when registration fails', async () => {
      const registerInput: RegisterInput = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockClient.mutate.mockResolvedValueOnce({
        data: { register: null },
      });

      await expect(AuthService.register(registerInput)).rejects.toThrow('Registration failed');
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears authentication state', async () => {
      // First login to set state
      const mockResponse = {
        data: {
          login: {
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
            token: 'jwt-token',
          },
        },
      };

      mockClient.mutate.mockResolvedValueOnce(mockResponse);
      await AuthService.login({ email: 'test@example.com', password: 'password' });

      expect(AuthService.isAuthenticated()).toBe(true);

      // Now logout
      await AuthService.logout();

      expect(AuthService.isAuthenticated()).toBe(false);
      expect(AuthService.getCurrentUser()).toBeNull();
      expect(mockClient.clearStore).toHaveBeenCalled();
    });
  });

  describe('user data sanitization', () => {
    it('sanitizes user data to prevent XSS', async () => {
      const maliciousUser = {
        id: '1',
        email: 'test<script>alert("xss")</script>@example.com',
        firstName: 'John<script>',
        lastName: 'Doe</script>',
      };

      const mockResponse = {
        data: {
          login: {
            user: maliciousUser,
            token: 'jwt-token',
          },
        },
      };

      mockClient.mutate.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.user.email).not.toContain('<script>');
      expect(result.user.firstName).not.toContain('<script>');
      expect(result.user.lastName).not.toContain('</script>');
      expect(result.user.email).toContain('&lt;script&gt;');
    });
  });
});
