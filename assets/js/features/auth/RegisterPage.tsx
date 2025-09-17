import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GitFork,
  UsersRound,
  LayoutTemplate,
} from 'lucide-react';
import { ThemeToggle } from '../flow-builder/components/ThemeToggle';
import { useAuth } from '../../shared/contexts/AuthContext';
import { PasswordStrength } from '../../shared/components/ui/PasswordStrength';

// Extend Window interface to include topbar
declare global {
  interface Window {
    topbar?: {
      show: () => void;
      hide: () => void;
    };
  }
}

export const RegisterPage: React.FC = () => {
  const { register, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't clear error immediately - preserve it until we know the outcome
    setIsLoading(true);

    // Show topbar loading indicator
    if (window.topbar) {
      window.topbar.show();
    }

    // Client-side validation
    const validationErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      validationErrors.firstName = 'Please enter your first name';
    }

    if (!lastName.trim()) {
      validationErrors.lastName = 'Please enter your last name';
    }

    if (!email.trim()) {
      validationErrors.email = 'Please enter your email address';
    }

    if (!password.trim()) {
      validationErrors.password = 'Please enter your password';
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setIsLoading(false);
      if (window.topbar) {
        window.topbar.hide();
      }
      return;
    }

    try {
      // Clear previous errors only when attempting registration
      setError('');
      setFieldErrors({});

      await register({ email, password, firstName, lastName });
      // Redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      if (window.topbar) {
        window.topbar.hide();
      }
    }
  };

  const loading = isLoading || authLoading;

  return (
    <div className='login-page'>
      {/* Theme Toggle */}
      <div className='login-theme-toggle'>
        <ThemeToggle />
      </div>

      <div className='login-container'>
        {/* Left side - Branding */}
        <div className='login-brand-section'>
          <div className='login-brand-content'>
            <h2 className='login-brand-title'>Join the AI Revolution</h2>
            <p className='login-brand-subtitle'>
              Create your account and start building intelligent multi-agent systems with visual
              simplicity.
            </p>

            <div className='login-features'>
              <div className='login-feature'>
                <div className='login-feature-icon'>
                  <Cpu size={18} />
                </div>
                <div className='login-feature-content'>
                  <h3 className='login-feature-title'>Advanced Node System</h3>
                  <p className='login-feature-description'>
                    10+ specialized AI components: agents, sensors, memory, and decision logic
                  </p>
                </div>
              </div>
              <div className='login-feature'>
                <div className='login-feature-icon'>
                  <UsersRound size={18} />
                </div>
                <div className='login-feature-content'>
                  <h3 className='login-feature-title'>Live Collaboration</h3>
                  <p className='login-feature-description'>
                    Real-time editing with your team through instant WebSocket sync
                  </p>
                </div>
              </div>
              <div className='login-feature'>
                <div className='login-feature-icon'>
                  <GitFork size={18} />
                </div>
                <div className='login-feature-content'>
                  <h3 className='login-feature-title'>Professional Canvas</h3>
                  <p className='login-feature-description'>
                    Drag-and-drop editor with minimap, properties, and light/dark mode
                  </p>
                </div>
              </div>
              <div className='login-feature'>
                <div className='login-feature-icon'>
                  <LayoutTemplate size={18} />
                </div>
                <div className='login-feature-content'>
                  <h3 className='login-feature-title'>Ready-Made Templates</h3>
                  <p className='login-feature-description'>
                    16+ workflow templates for business, healthcare, finance, and more
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className='login-form-section'>
          <div className='login-form'>
            {/* Logo and Title */}
            <div className='login-header'>
              <div className='login-logo'>
                <Cpu className='login-logo-icon' />
                <span className='login-logo-text'>Helix</span>
              </div>
              <h1 className='login-title'>Create account</h1>
              <p className='login-subtitle'>Sign up to get started with Helix</p>
            </div>

            {/* Form-level Error Message */}
            {error && (
              <div className='login-form-error'>
                {error.split('\n').map((errorLine, index) => (
                  <p key={index} className='login-form-error-text'>
                    {errorLine}
                  </p>
                ))}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className='login-form-content'>
              {/* Name Fields */}
              <div className='login-field-group'>
                <div className='login-field'>
                  <label htmlFor='firstName' className='login-label'>
                    First name
                  </label>
                  <div className='login-input-wrapper'>
                    <User className='login-input-icon' />
                    <input
                      id='firstName'
                      type='text'
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className={`login-input ${fieldErrors.firstName ? 'login-input--error' : ''}`}
                      placeholder='Enter your first name'
                      required
                      autoComplete='given-name'
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <p className='login-field-error'>{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className='login-field'>
                  <label htmlFor='lastName' className='login-label'>
                    Last name
                  </label>
                  <div className='login-input-wrapper'>
                    <User className='login-input-icon' />
                    <input
                      id='lastName'
                      type='text'
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className={`login-input ${fieldErrors.lastName ? 'login-input--error' : ''}`}
                      placeholder='Enter your last name'
                      required
                      autoComplete='family-name'
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <p className='login-field-error'>{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className='login-field'>
                <label htmlFor='email' className='login-label'>
                  Email address
                </label>
                <div className='login-input-wrapper'>
                  <Mail className='login-input-icon' />
                  <input
                    id='email'
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`login-input ${fieldErrors.email ? 'login-input--error' : ''}`}
                    placeholder='Enter your email'
                    required
                    autoComplete='email'
                  />
                </div>
                {fieldErrors.email && <p className='login-field-error'>{fieldErrors.email}</p>}
              </div>

              {/* Password Field */}
              <div className='login-field'>
                <label htmlFor='password' className='login-label'>
                  Password
                </label>
                <div className='login-input-wrapper'>
                  <Lock className='login-input-icon' />
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`login-input ${fieldErrors.password ? 'login-input--error' : ''}`}
                    placeholder='Enter your password'
                    required
                    autoComplete='new-password'
                    minLength={8}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='login-password-toggle'
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className='login-field-error'>{fieldErrors.password}</p>
                )}
                <PasswordStrength password={password} />
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading || !email || !password || !firstName || !lastName}
                className={`login-submit ${loading ? 'login-submit--loading' : ''}`}
              >
                {loading ? (
                  <>
                    <div className='login-spinner'></div>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className='login-form-footer'>
              <p className='login-footer-text'>
                Already have an account?{' '}
                <a href='/login' className='login-footer-link'>
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className='login-page-footer'>
        <div className='login-page-footer-content'>
          <div className='login-page-footer-left'>
            <span className='login-page-footer-text'>
              © {new Date().getFullYear()} Helix. Built for the AI community.
            </span>
          </div>
          <div className='login-page-footer-right'>
            <a href='#' className='login-page-footer-link'>
              Privacy Policy
            </a>
            <a href='#' className='login-page-footer-link'>
              Terms of Service
            </a>
            <a href='https://github.com/ccarvalho-eng/helix' className='login-page-footer-link'>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
