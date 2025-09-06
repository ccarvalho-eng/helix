import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebSocket Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='error-boundary'>
            <h3>Connection Error</h3>
            <p>
              There was an issue with the real-time connection. You can continue working offline.
            </p>
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false })}>Retry Connection</button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
