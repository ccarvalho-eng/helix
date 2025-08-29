import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowAIFlowBuilder } from './features/flow-builder';

function AIFlowApp() {
  try {
    return <ReactFlowAIFlowBuilder />;
  } catch (error) {
    console.error('Error in AIFlowApp:', error);
    return (
      <div style={{ padding: '20px', background: 'red', color: 'white' }}>
        <h1>Error occurred</h1>
        <p>Check console for details: {error?.toString()}</p>
      </div>
    );
  }
}

// Mount the React app when the DOM is loaded
let currentRoot: any = null;

function mountReactApp() {
  const container = document.getElementById('ai-flow-builder');
  
  // Only mount if the container exists (flow page)
  if (container && !container.hasAttribute('data-react-mounted')) {
    container.setAttribute('data-react-mounted', 'true');
    
    // Clean up any existing root
    if (currentRoot) {
      try {
        currentRoot.unmount();
      } catch (e) {
        // Silent cleanup error
      }
    }
    
    currentRoot = createRoot(container);
    currentRoot.render(<AIFlowApp />);
  }
}

// Only mount on pages that have the ai-flow-builder container
function shouldMountReactApp() {
  return document.getElementById('ai-flow-builder') !== null;
}

// Try to mount immediately if DOM is ready and we're on the flow page
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

// Also try mounting on LiveView page loads, but only if we're on the flow page
document.addEventListener('phx:page-loading-stop', () => {
  if (shouldMountReactApp()) {
    mountReactApp();
  }
});

// Fallback timeout, but only if we're on the flow page
setTimeout(() => {
  if (shouldMountReactApp()) {
    mountReactApp();
  }
}, 100);

export default AIFlowApp;