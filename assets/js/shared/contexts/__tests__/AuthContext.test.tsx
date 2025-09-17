import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the auth service
jest.mock('../../services/auth', () => ({
  AuthService: {
    getStoredUser: jest.fn(),
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

import { AuthService } from '../../services/auth';
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid='user'>{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid='isAuthenticated'>{isAuthenticated.toString()}</div>
      <div data-testid='isLoading'>{isLoading.toString()}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button
        onClick={() =>
          register({
            email: 'test@example.com',
            password: 'password',
            firstName: 'Test',
            lastName: 'User',
          })
        }
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to test to skip server calls
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = 'development';
  });

  it('provides initial auth state', () => {
    mockAuthService.getCurrentUser.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  it('provides stored user when authenticated', () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
  });

  it('handles login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockAuthService.getCurrentUser.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');

    await act(async () => {
      loginButton.click();
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles register', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockAuthService.getCurrentUser.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.register.mockResolvedValue({ user: mockUser, token: 'mock-token' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');

    await act(async () => {
      registerButton.click();
    });

    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('handles logout', () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockAuthService.isAuthenticated.mockReturnValue(true);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');

    act(() => {
      logoutButton.click();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
