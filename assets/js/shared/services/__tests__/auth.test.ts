import { AuthService, User } from '../auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock sessionStorage
const mockSessionStorage = {
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    // Reset localStorage mock to default behavior
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => null);
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('token management', () => {
    it('gets stored token', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'helix_auth_token') return 'test-token';
        if (key === 'helix_token_expiry') return String(Date.now() + 3600000); // Valid expiry
        return null;
      });

      const token = AuthService.getToken();

      expect(token).toBe('test-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('helix_auth_token');
    });

    it('returns null when no token stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const token = AuthService.getToken();

      expect(token).toBeNull();
    });

    it('sets token with expiry', () => {
      const testToken = 'test-token';
      const beforeTime = Date.now();

      AuthService.setToken(testToken);

      const afterTime = Date.now();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('helix_auth_token', testToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'helix_token_expiry',
        expect.any(String)
      );

      // Check that expiry is approximately 24 hours from now
      const expiryCall = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'helix_token_expiry'
      );
      const expiryTime = parseInt(expiryCall[1] as string);
      const expectedExpiry = beforeTime + 24 * 60 * 60 * 1000; // 24 hours

      expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry);
      expect(expiryTime).toBeLessThanOrEqual(afterTime + 24 * 60 * 60 * 1000);
    });

    it('handles localStorage errors when setting token', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        AuthService.setToken('test-token');
      }).toThrow('Failed to store authentication token');
    });

    it('removes token', () => {
      AuthService.removeToken();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_token_expiry');
    });

    it('handles localStorage errors when removing token', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, just log error
      expect(() => {
        AuthService.removeToken();
      }).not.toThrow();
    });

    it('returns null for expired token', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'helix_auth_token') return 'expired-token';
        if (key === 'helix_token_expiry') return String(Date.now() - 3600000); // Expired
        return null;
      });

      const token = AuthService.getToken();

      expect(token).toBeNull();
      // Should also call logout/removeToken
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_auth_token');
    });

    it('handles missing expiry gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'helix_auth_token') return 'test-token';
        if (key === 'helix_token_expiry') return null;
        return null;
      });

      const token = AuthService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('user management', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('gets stored user', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const user = AuthService.getStoredUser();

      expect(user).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('helix_user_data');
    });

    it('returns null when no user stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const user = AuthService.getStoredUser();

      expect(user).toBeNull();
    });

    it('returns null when stored user data is invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const user = AuthService.getStoredUser();

      expect(user).toBeNull();
    });

    it('sets user data with sanitization', () => {
      const userWithScripts: User = {
        id: '1',
        email: 'test<script>alert("xss")</script>@example.com',
        firstName: 'Test<img src=x onerror=alert(1)>',
        lastName: 'User</script>',
      };

      // Ensure setItem doesn't throw
      mockLocalStorage.setItem.mockImplementation(() => {});

      AuthService.setStoredUser(userWithScripts);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'helix_user_data',
        expect.stringContaining(
          'test&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;@example.com'
        )
      );
    });

    it('sanitizes user data properly', () => {
      const maliciousUser: User = {
        id: '1',
        email: 'test<script>alert("xss")</script>@example.com',
        firstName: 'Test<img src=x onerror=alert(1)>',
        lastName: 'User</script><style>body{display:none}</style>',
      };

      // Ensure setItem doesn't throw
      mockLocalStorage.setItem.mockImplementation(() => {});

      AuthService.setStoredUser(maliciousUser);

      const storedData = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'helix_user_data'
      )?.[1] as string;

      const storedUser = JSON.parse(storedData);

      // Should escape HTML entities
      expect(storedUser.email).not.toContain('<script>');
      expect(storedUser.email).toContain('&lt;script&gt;');
      expect(storedUser.firstName).not.toContain('<img');
      expect(storedUser.firstName).toContain('&lt;img');
      expect(storedUser.lastName).not.toContain('</script>');
      expect(storedUser.lastName).toContain('&lt;&#x2F;script&gt;');
    });

    it('handles localStorage errors when setting user', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        AuthService.setStoredUser(mockUser);
      }).toThrow('Failed to store user data');
    });

    it('removes user data', () => {
      AuthService.removeStoredUser();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_user_data');
    });

    it('handles localStorage errors when removing user', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, just log error
      expect(() => {
        AuthService.removeStoredUser();
      }).not.toThrow();
    });
  });

  describe('session management', () => {
    // Remove the complex Apollo mocking since logout doesn't actually use client.clearStore anymore

    it('logs out user and clears all data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      AuthService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_token_expiry');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('helix_user_data');
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('User logged out successfully');

      consoleSpy.mockRestore();
    });

    it('handles errors during logout gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, just log errors
      expect(() => {
        AuthService.logout();
      }).not.toThrow();
    });
  });

  describe('string sanitization', () => {
    it('truncates long strings', () => {
      const longString = 'a'.repeat(300);
      const user: User = {
        id: '1',
        email: longString + '@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Ensure setItem doesn't throw
      mockLocalStorage.setItem.mockImplementation(() => {});

      AuthService.setStoredUser(user);

      const storedData = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'helix_user_data'
      )?.[1] as string;

      const storedUser = JSON.parse(storedData);

      // Email should be truncated to 255 characters
      expect(storedUser.email.length).toBeLessThanOrEqual(255);
    });

    it('handles non-string values gracefully', () => {
      // This tests the sanitizeString function's type checking
      const userWithInvalidTypes = {
        id: '1',
        email: null as unknown,
        firstName: undefined as unknown,
        lastName: 123 as unknown,
      };

      // Ensure setItem doesn't throw
      mockLocalStorage.setItem.mockImplementation(() => {});

      AuthService.setStoredUser(userWithInvalidTypes as User);

      const storedData = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'helix_user_data'
      )?.[1] as string;

      const storedUser = JSON.parse(storedData);

      // Non-string values should be converted to empty strings
      expect(storedUser.email).toBe('');
      expect(storedUser.firstName).toBe('');
      expect(storedUser.lastName).toBe('');
    });
  });

  describe('edge cases', () => {
    it('handles missing localStorage gracefully', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage;
      delete (window as unknown as Record<string, unknown>).localStorage;

      expect(() => {
        AuthService.getToken();
      }).not.toThrow();

      expect(() => {
        AuthService.setToken('test');
      }).toThrow('Failed to store authentication token');

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
      });
    });

    it('handles missing sessionStorage gracefully', () => {
      // Temporarily remove sessionStorage
      const originalSessionStorage = window.sessionStorage;
      delete (window as unknown as Record<string, unknown>).sessionStorage;

      expect(() => {
        AuthService.logout();
      }).not.toThrow();

      // Restore sessionStorage
      Object.defineProperty(window, 'sessionStorage', {
        value: originalSessionStorage,
      });
    });
  });
});
