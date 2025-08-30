import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  active = false,
  className = '',
}: ButtonProps) {
  const baseClass = 'btn';
  const activeClass = active ? 'btn--active' : '';
  const fullClassName = `${baseClass} ${activeClass} ${className}`.trim();

  return (
    <button onClick={onClick} disabled={disabled} className={fullClassName}>
      {children}
    </button>
  );
}
