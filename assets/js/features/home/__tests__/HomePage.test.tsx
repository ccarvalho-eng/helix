import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomePage } from '../HomePage';
import { useAuth } from '../../../shared/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../../shared/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ProtectedRoute
jest.mock('../../../shared/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ThemeToggle to avoid ThemeContext issues
jest.mock('../../flow-builder/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle'>Theme Toggle</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('HomePage', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      refetchUser: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the home page with user information', () => {
    render(<HomePage />);

    expect(screen.getByText('Helix')).toBeInTheDocument();
    expect(screen.getByText('AI Flow Builder')).toBeInTheDocument();
    expect(screen.getByText('New Flow')).toBeInTheDocument();
    expect(screen.getByText('My Workflows')).toBeInTheDocument();
  });

  it('displays the logout button', () => {
    render(<HomePage />);

    const logoutButton = screen.getByLabelText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    render(<HomePage />);

    const logoutButton = screen.getByLabelText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays quick actions', () => {
    render(<HomePage />);

    expect(screen.getByText('Create New Flow')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  it('displays New Flow button', () => {
    render(<HomePage />);

    const newFlowButton = screen.getByText('New Flow');
    expect(newFlowButton).toBeInTheDocument();
    expect(newFlowButton.tagName).toBe('BUTTON');
  });

  it('handles missing user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      refetchUser: jest.fn(),
    });

    render(<HomePage />);

    expect(screen.getByText('Helix')).toBeInTheDocument();
  });

  it('displays workflow management section', () => {
    render(<HomePage />);

    expect(screen.getByText('My Workflows')).toBeInTheDocument();
    expect(screen.getByText('Create New Flow')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });
});
