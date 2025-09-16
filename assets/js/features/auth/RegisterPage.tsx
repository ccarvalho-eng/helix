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
import { FormValidator } from '../../shared/utils/validation';

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
  const [_fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't clear error immediately - preserve it until we know the outcome
    setIsLoading(true);

    // Show topbar loading indicator
    if (window.topbar) {
      window.topbar.show();
    }

    // Validate form
    const validationErrors = FormValidator.validateRegisterForm(
      email,
      password,
      firstName,
      lastName
    );
    if (validationErrors.length > 0) {
      const errors: Record<string, string> = {};
      let generalError = '';

      validationErrors.forEach(err => {
        errors[err.field] = err.message;
        if (!generalError) {
          generalError = err.message;
        }
      });

      setFieldErrors(errors);
      setError(generalError); // Show the first validation error as general error
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

            {/* Error Message */}
            {error && (
              <div className='login-error'>
                <p className='login-error-text'>{error}</p>
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
                      className='login-input'
                      placeholder='Enter your first name'
                      required
                      autoComplete='given-name'
                    />
                  </div>
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
                      className='login-input'
                      placeholder='Enter your last name'
                      required
                      autoComplete='family-name'
                    />
                  </div>
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
                    className='login-input'
                    placeholder='Enter your email'
                    required
                    autoComplete='email'
                  />
                </div>
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
                    className='login-input'
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
                <p className='login-field-hint'>Minimum 8 characters</p>
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
