import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '../PasswordStrength';

describe('PasswordStrength', () => {
  it('renders nothing for empty password', () => {
    const { container } = render(<PasswordStrength password='' />);
    expect(container.firstChild).toBeNull();
  });

  it('shows all requirements for weak password', () => {
    render(<PasswordStrength password='weak' />);

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();

    // Check strength label
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByText('1/4 requirements met')).toBeInTheDocument();

    // Check that lowercase requirement is met (shows ✓)
    const requirementItems = screen.getAllByText(/[✓○]/);
    expect(requirementItems).toHaveLength(4);
  });

  it('shows correct strength for password with multiple requirements', () => {
    render(<PasswordStrength password='password' />);

    // Should pass length and lowercase (2/4 = Fair)
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('2/4 requirements met')).toBeInTheDocument();
  });

  it('shows good strength for password with 3 requirements', () => {
    render(<PasswordStrength password='Password' />);

    // Should pass length, lowercase, and uppercase (3/4 = Good)
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('3/4 requirements met')).toBeInTheDocument();
  });

  it('shows strong strength for password with all requirements', () => {
    render(<PasswordStrength password='Password123' />);

    // Should pass all 4 requirements (4/4 = Strong)
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('4/4 requirements met')).toBeInTheDocument();
  });

  it('shows correct check marks for met requirements', () => {
    render(<PasswordStrength password='Password123' />);

    // All requirements should show ✓
    const checkMarks = screen.getAllByText('✓');
    expect(checkMarks).toHaveLength(4);

    const circles = screen.queryAllByText('○');
    expect(circles).toHaveLength(0);
  });

  it('shows circles for unmet requirements', () => {
    render(<PasswordStrength password='weak' />);

    // Only lowercase should show ✓, others should show ○
    const checkMarks = screen.getAllByText('✓');
    expect(checkMarks).toHaveLength(1);

    const circles = screen.getAllByText('○');
    expect(circles).toHaveLength(3);
  });

  it('correctly evaluates length requirement', () => {
    render(<PasswordStrength password='1234567' />); // 7 characters - has numbers but not length
    expect(screen.getByText('1/4 requirements met')).toBeInTheDocument(); // only number

    const { rerender } = render(<PasswordStrength password='12345678' />); // 8 characters
    rerender(<PasswordStrength password='12345678' />);
    expect(screen.getByText('2/4 requirements met')).toBeInTheDocument(); // length + number
  });

  it('correctly evaluates lowercase requirement', () => {
    render(<PasswordStrength password='PASSWORD123' />);
    // Should fail lowercase - has length + uppercase + number
    expect(screen.getByText('3/4 requirements met')).toBeInTheDocument(); // length + uppercase + number
  });

  it('correctly evaluates uppercase requirement', () => {
    render(<PasswordStrength password='password123' />);
    // Should fail uppercase - has length + lowercase + number
    expect(screen.getByText('3/4 requirements met')).toBeInTheDocument(); // length + lowercase + number
  });

  it('correctly evaluates number requirement', () => {
    render(<PasswordStrength password='Password' />);
    // Should fail number
    expect(screen.getByText('3/4 requirements met')).toBeInTheDocument(); // length + lowercase + uppercase
  });

  it('handles edge case with exactly 8 characters', () => {
    render(<PasswordStrength password='Abcdef12' />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('4/4 requirements met')).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    render(<PasswordStrength password='test123' />);

    // Check main container
    expect(document.querySelector('.password-strength')).toBeInTheDocument();

    // Check progress bar
    expect(document.querySelector('.password-strength__bar')).toBeInTheDocument();
    expect(document.querySelector('.password-strength__fill')).toBeInTheDocument();

    // Check info section
    expect(document.querySelector('.password-strength__info')).toBeInTheDocument();

    // Check requirements list
    expect(document.querySelector('.password-strength__requirements')).toBeInTheDocument();
  });

  it('shows correct progress bar width', () => {
    render(<PasswordStrength password='Password123' />);

    const progressBar = document.querySelector('.password-strength__fill') as HTMLElement;
    expect(progressBar).toHaveStyle('width: 100%'); // 4/4 = 100%
  });

  it('updates dynamically when password changes', () => {
    const { rerender } = render(<PasswordStrength password='weak' />);

    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByText('1/4 requirements met')).toBeInTheDocument();

    rerender(<PasswordStrength password='StrongPassword123' />);

    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('4/4 requirements met')).toBeInTheDocument();
  });

  it('handles special characters correctly', () => {
    render(<PasswordStrength password='P@ssw0rd!' />);

    // Special characters don't affect basic requirements
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('4/4 requirements met')).toBeInTheDocument();
  });

  it('handles very long passwords', () => {
    const longPassword = 'VeryLongPassword123' + 'a'.repeat(100);
    render(<PasswordStrength password={longPassword} />);

    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('4/4 requirements met')).toBeInTheDocument();
  });

  it('has correct CSS classes for met requirements', () => {
    render(<PasswordStrength password='Password123' />);

    const requirements = document.querySelectorAll('.password-strength__requirement');
    requirements.forEach(req => {
      expect(req).toHaveClass('password-strength__requirement--met');
    });
  });

  it('has correct CSS classes for unmet requirements', () => {
    render(<PasswordStrength password='weak' />);

    const requirements = document.querySelectorAll('.password-strength__requirement');
    const metRequirements = document.querySelectorAll('.password-strength__requirement--met');

    expect(requirements).toHaveLength(4);
    expect(metRequirements).toHaveLength(1); // Only lowercase is met
  });
});
