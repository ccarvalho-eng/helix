import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '../../../lib/apollo';
import { AuthProvider } from '../../../shared/contexts/AuthContext';
import { LoginPage } from '../LoginPage';

// Mock the ThemeToggle component since it's imported
jest.mock('../../flow-builder/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle'>Theme Toggle</div>,
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApolloProvider client={client}>
    <AuthProvider>{children}</AuthProvider>
  </ApolloProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page with main sections', () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    // Check branding section
    expect(screen.getByText('Design AI Agent Workflows')).toBeInTheDocument();
    expect(
      screen.getByText(/Build, collaborate, and deploy intelligent multi-agent systems/)
    ).toBeInTheDocument();

    // Check form section
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders all feature items', () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    expect(screen.getByText('Advanced Node System')).toBeInTheDocument();
    expect(screen.getByText('Live Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Professional Canvas')).toBeInTheDocument();
    expect(screen.getByText('Ready-Made Templates')).toBeInTheDocument();
  });

  it('renders login form elements', () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('handles email input', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('handles password input', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  it('toggles password visibility', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('disables submit button when form is empty', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is filled', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state on form submission', async () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
      },
      { timeout: 2000 }
    );
  });

  it('renders footer with correct links', () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    expect(screen.getByText(/© \d{4} Helix\. Built for the AI community\./)).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    render(<LoginPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('has proper form accessibility', () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });
});
