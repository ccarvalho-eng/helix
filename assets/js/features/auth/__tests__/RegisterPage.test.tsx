import { render, screen, fireEvent } from '@testing-library/react';

// Mock dependencies
jest.mock('../../../shared/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../../flow-builder/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle'>Theme Toggle</div>,
}));

jest.mock('../../../shared/components/ui/PasswordStrength', () => ({
  PasswordStrength: ({ password }: { password: string }) => (
    <div data-testid='password-strength'>{password ? `Strength for: ${password}` : ''}</div>
  ),
}));

import { RegisterPage } from '../RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText('First name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    expect(firstNameInput.value).toBe('John');
    expect(emailInput.value).toBe('john@example.com');
  });

  it('toggles password visibility', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
  });

  it('shows password strength component', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    expect(screen.getByText('Strength for: testpass')).toBeInTheDocument();
  });

  it('disables submit when form is incomplete', () => {
    render(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: 'Create account' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when all fields are filled', () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: 'Create account' });
    expect(submitButton).not.toBeDisabled();
  });
});
