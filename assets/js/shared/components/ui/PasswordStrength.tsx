interface PasswordStrengthProps {
  password: string;
}

interface StrengthCheck {
  label: string;
  test: (_password: string) => boolean;
  met: boolean;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks: StrengthCheck[] = [
    {
      label: 'At least 8 characters',
      test: pwd => pwd.length >= 8,
      met: password.length >= 8,
    },
    {
      label: 'One lowercase letter',
      test: pwd => /[a-z]/.test(pwd),
      met: /[a-z]/.test(password),
    },
    {
      label: 'One uppercase letter',
      test: pwd => /[A-Z]/.test(pwd),
      met: /[A-Z]/.test(password),
    },
    {
      label: 'One number',
      test: pwd => /[0-9]/.test(pwd),
      met: /[0-9]/.test(password),
    },
  ];

  const metChecks = checks.filter(check => check.met).length;
  const strengthPercent = (metChecks / checks.length) * 100;

  const getStrengthLevel = () => {
    if (metChecks === 0) return { label: '', color: 'transparent' };
    if (metChecks <= 1) return { label: 'Weak', color: '#ef4444' };
    if (metChecks <= 2) return { label: 'Fair', color: '#f59e0b' };
    if (metChecks <= 3) return { label: 'Good', color: '#eab308' };
    return { label: 'Strong', color: '#22c55e' };
  };

  const strength = getStrengthLevel();

  if (!password) return null;

  return (
    <div className='password-strength'>
      <div className='password-strength__bar'>
        <div
          className='password-strength__fill'
          style={{
            width: `${strengthPercent}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      <div className='password-strength__info'>
        {strength.label && (
          <span className='password-strength__label' style={{ color: strength.color }}>
            {strength.label}
          </span>
        )}
        <span className='password-strength__count'>{metChecks}/4 requirements met</span>
      </div>
      <ul className='password-strength__requirements'>
        {checks.map((check, index) => (
          <li
            key={index}
            className={`password-strength__requirement ${
              check.met ? 'password-strength__requirement--met' : ''
            }`}
          >
            <span className='password-strength__check-mark'>{check.met ? '✓' : '○'}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
