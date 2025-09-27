import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { ReactNode } from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className='error-boundary'>
      <h2 className='error-boundary__title'>Something went wrong</h2>
      <p className='error-boundary__message'>Error: {error.message}</p>
      <button onClick={resetErrorBoundary} className='error-boundary__retry-btn'>
        Try Again
      </button>
    </div>
  );
}

interface ModernErrorBoundaryProps {
  children: ReactNode;
  onError?: (_error: Error, _errorInfo: any) => void;
}

export function ModernErrorBoundary({ children, onError }: ModernErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('React Error Boundary:', error, errorInfo);
    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}
