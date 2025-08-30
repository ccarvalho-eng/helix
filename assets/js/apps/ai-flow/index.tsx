import React from 'react';
import { createRoot } from 'react-dom/client';
import { FlowBuilder } from '../../features/flow-builder';

function AIFlowApp() {
  try {
    return <FlowBuilder />;
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

// Mount the React app
let currentRoot: any = null;

function mountReactApp() {
  const container = document.getElementById('ai-flow-builder');

  if (container && !container.hasAttribute('data-react-mounted')) {
    container.setAttribute('data-react-mounted', 'true');

    // Clean up any existing root
    if (currentRoot) {
      currentRoot.unmount();
    }

    currentRoot = createRoot(container);
    currentRoot.render(<AIFlowApp />);
  }
}

function initializeApp() {
  const container = document.getElementById('ai-flow-builder');
  if (container) {
    mountReactApp();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
