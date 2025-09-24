import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '../../lib/apollo';
import { AuthRouter } from '../../features/auth/AuthRouter';
import { AuthProvider } from '../../shared/contexts/AuthContext';
import { ThemeProvider } from '../../features/flow-builder/contexts/ThemeContext';

function AuthApp() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <AuthRouter />
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

// Mount the React app when the DOM is loaded
let currentRoot: ReturnType<typeof createRoot> | null = null;

function mountReactApp() {
  const container = document.getElementById('auth-app');

  // Only mount if the container exists (auth page)
  if (container && !container.hasAttribute('data-react-mounted')) {
    container.setAttribute('data-react-mounted', 'true');

    // Clean up any existing root
    if (currentRoot) {
      try {
        currentRoot.unmount();
      } catch {
        // Silent cleanup error
      }
    }

    currentRoot = createRoot(container);
    currentRoot.render(<AuthApp />);
  }
}

// Only mount on pages that have the auth-app container
function shouldMountReactApp() {
  return document.getElementById('auth-app') !== null;
}

// Try to mount immediately if DOM is ready and we're on the auth page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (shouldMountReactApp()) {
      mountReactApp();
    }
  });
} else {
  if (shouldMountReactApp()) {
    mountReactApp();
  }
}

// Also try mounting on LiveView page loads, but only if we're on the auth page
document.addEventListener('phx:page-loading-stop', () => {
  if (shouldMountReactApp()) {
    mountReactApp();
  }
});

// Fallback timeout, but only if we're on the auth page
setTimeout(() => {
  if (shouldMountReactApp()) {
    mountReactApp();
  }
}, 100);

export default AuthApp;
