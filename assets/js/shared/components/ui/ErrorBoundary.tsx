import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReactFlow Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary'>
          <h2 className='error-boundary__title'>Something went wrong with ReactFlow</h2>
          <p className='error-boundary__message'>Error: {this.state.error?.toString()}</p>
          <button onClick={this.handleRetry} className='error-boundary__retry-btn'>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
