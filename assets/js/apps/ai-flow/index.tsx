import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '../../lib/apollo';
import { AuthProvider } from '../../shared/contexts/AuthContext';
import { FlowBuilder } from '../../features/flow-builder';

// Error Boundary for proper React error handling
class AIFlowErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AIFlow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='p-5 bg-red-500 text-white rounded'>
          <h1 className='text-xl font-bold mb-2'>Something went wrong</h1>
          <details>
            <summary className='cursor-pointer'>Error details</summary>
            <pre className='mt-2 text-sm overflow-auto'>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function AIFlowApp(): React.ReactElement {
  return (
    <AIFlowErrorBoundary>
      <ApolloProvider client={client}>
        <AuthProvider>
          <FlowBuilder />
        </AuthProvider>
      </ApolloProvider>
    </AIFlowErrorBoundary>
  );
}

// Properly typed root management
let reactRoot: Root | null = null;

function mountReactApp(): void {
  const container = document.getElementById('ai-flow-builder');

  if (!container) {
    return;
  }

  if (container.hasAttribute('data-react-mounted')) {
    return;
  }

  container.setAttribute('data-react-mounted', 'true');

  // Cleanup existing root
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  reactRoot = createRoot(container);
  reactRoot.render(<AIFlowApp />);
}

// Cleanup function for proper memory management
function unmountReactApp(): void {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  const container = document.getElementById('ai-flow-builder');
  if (container) {
    container.removeAttribute('data-react-mounted');
  }
}

// Initialize with proper DOM ready handling
function initialize(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactApp);
  } else {
    mountReactApp();
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', unmountReactApp);

// Auto-initialize
initialize();

// Export for manual control if needed
export { mountReactApp, unmountReactApp };
