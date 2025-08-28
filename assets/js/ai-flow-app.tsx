import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkingAIFlowBuilder } from './components/flow-builder/WorkingAIFlowBuilder';

function AIFlowApp() {
  try {
    return <WorkingAIFlowBuilder />;
  } catch (error) {
    return (
      <div style={{ padding: '20px', background: 'red', color: 'white' }}>
        <h1>Error occurred</h1>
        <p>Check console for details: {error?.toString()}</p>
      </div>
    );
  }
}

// Mount the React app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ai-flow-builder');
  if (container) {
    const root = createRoot(container);
    root.render(<AIFlowApp />);
  }
});

export default AIFlowApp;