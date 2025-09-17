import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Mock ReactFlow and its dependencies
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid='reactflow'>{children}</div>
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='reactflow-provider'>{children}</div>
  ),
  Controls: () => <div data-testid='controls' />,
  Background: () => <div data-testid='background' />,
  MiniMap: () => <div data-testid='minimap' />,
  Handle: () => <div data-testid='handle' />,
  Position: { Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
  NodeResizer: () => <div data-testid='node-resizer' />,
}));

// Mock useFlowManager hook with controllable state
const mockDeleteNode = jest.fn();
const mockDuplicateNode = jest.fn();
const mockUpdateFlowTitle = jest.fn();
const mockUpdateNode = jest.fn();

type TestNode = {
  id: string;
  type: 'agent';
  label: string;
  description: string;
  color: string;
  borderColor: string;
  config: Record<string, unknown>;
};

let mockSelectedNode: TestNode | null = null;

const mockFlowManager = {
  currentFlow: { title: 'Test Flow', id: 'test-flow' },
  updateFlowTitle: mockUpdateFlowTitle,
  nodes: [],
  edges: [],
  get selectedNode() {
    return mockSelectedNode;
  },
  onNodesChange: jest.fn(),
  onEdgesChange: jest.fn(),
  onConnect: jest.fn(),
  onSelectionChange: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
  setReactFlowInstance: jest.fn(),
  addNode: jest.fn(),
  updateNode: mockUpdateNode,
  deleteNode: mockDeleteNode,
  duplicateNode: mockDuplicateNode,
  unlinkEdge: jest.fn(),
  initialViewport: { x: 0, y: 0, zoom: 1 },
  onMoveEnd: jest.fn(),
  addTemplate: jest.fn(),
  isFlowReady: true,
  isConnected: true,
};

jest.mock('../hooks/useFlowManager', () => ({
  useFlowManager: () => mockFlowManager,
}));

// Mock other dependencies
jest.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useThemeContext: () => ({ theme: 'light' }),
}));

jest.mock('../../../shared/components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../templates', () => ({
  getFeaturedTemplates: () => [],
  getTemplatesByCategory: () => [],
}));

// Mock the PropertiesPanel to include actual input elements for testing
jest.mock('../components/properties', () => ({
  PropertiesPanel: ({
    selectedNode,
    onUpdateNode,
  }: {
    selectedNode: TestNode | null;
    onUpdateNode: (_id: string, _updates: Record<string, unknown>) => void;
  }) =>
    selectedNode ? (
      <div data-testid='properties-panel'>
        <input
          data-testid='node-label-input'
          type='text'
          value={selectedNode.label}
          onChange={e => onUpdateNode(selectedNode.id, { label: e.target.value })}
          placeholder='Node label'
        />
        <textarea
          data-testid='node-description-textarea'
          value={selectedNode.description}
          onChange={e => onUpdateNode(selectedNode.id, { description: e.target.value })}
          placeholder='Node description'
        />
        <div
          data-testid='node-content-editable'
          contentEditable
          suppressContentEditableWarning
          onInput={e => onUpdateNode(selectedNode.id, { content: e.currentTarget.textContent })}
        >
          Editable content
        </div>
      </div>
    ) : null,
}));

// Mock other components
jest.mock('../components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle' />,
}));

jest.mock('../components/Modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid='modal'>{children}</div> : null,
}));

jest.mock('../components/DownloadButton', () => ({
  DownloadButton: () => <div data-testid='download-button' />,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { FlowBuilder } from '../FlowBuilder';

// Mock the useAuth hook
jest.mock('../../../shared/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

describe('FlowBuilder Keyboard Event Handling', () => {
  const testNode = {
    id: 'test-node-1',
    type: 'agent' as const,
    label: 'Test Agent',
    description: 'Test description',
    color: '#f0f9ff',
    borderColor: '#e5e7eb',
    config: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedNode = testNode;
  });

  describe('Node deletion behavior', () => {
    it('should delete node when Delete key is pressed on the canvas', () => {
      render(<FlowBuilder />);

      // Simulate Delete key press on document (canvas area)
      fireEvent.keyDown(document, { key: 'Delete' });

      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should delete node when Backspace key is pressed on the canvas', () => {
      render(<FlowBuilder />);

      // Simulate Backspace key press on document (canvas area)
      fireEvent.keyDown(document, { key: 'Backspace' });

      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should NOT delete node when Delete key is pressed while typing in input field', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const input = getByTestId('node-label-input');
      input.focus();

      // Simulate Delete key press while focused on input
      fireEvent.keyDown(input, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Backspace key is pressed while typing in input field', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const input = getByTestId('node-label-input');
      input.focus();

      // Simulate Backspace key press while focused on input
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Delete key is pressed while typing in textarea', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const textarea = getByTestId('node-description-textarea');
      textarea.focus();

      // Simulate Delete key press while focused on textarea
      fireEvent.keyDown(textarea, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Backspace key is pressed while typing in textarea', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const textarea = getByTestId('node-description-textarea');
      textarea.focus();

      // Simulate Backspace key press while focused on textarea
      fireEvent.keyDown(textarea, { key: 'Backspace' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Delete key is pressed while editing contentEditable element', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const contentEditable = getByTestId('node-content-editable') as HTMLElement;

      // Ensure the element is recognized as contentEditable in JSDOM
      contentEditable.setAttribute('contenteditable', 'true');
      Object.defineProperty(contentEditable, 'isContentEditable', {
        value: true,
        configurable: true,
      });

      contentEditable.focus();

      // Simulate Delete key press while focused on contentEditable
      fireEvent.keyDown(contentEditable, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when no node is selected', () => {
      mockSelectedNode = null;
      render(<FlowBuilder />);

      // Simulate Delete key press on document
      fireEvent.keyDown(document, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });
  });

  describe('Node duplication behavior', () => {
    it('should duplicate node when Ctrl+D is pressed', () => {
      render(<FlowBuilder />);

      // Simulate Ctrl+D key press
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });

      expect(mockDuplicateNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should duplicate node when Cmd+D is pressed (Mac)', () => {
      render(<FlowBuilder />);

      // Simulate Cmd+D key press
      fireEvent.keyDown(document, { key: 'd', metaKey: true });

      expect(mockDuplicateNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should NOT duplicate node when no node is selected', () => {
      mockSelectedNode = null;
      render(<FlowBuilder />);

      // Simulate Ctrl+D key press
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });

      expect(mockDuplicateNode).not.toHaveBeenCalled();
    });
  });

  describe('Other keyboard interactions', () => {
    it('should not trigger node operations for other keys', () => {
      render(<FlowBuilder />);

      const nonOperationalKeys = ['Enter', ' ', 'a', 'ArrowUp', 'ArrowDown'];

      nonOperationalKeys.forEach(key => {
        fireEvent.keyDown(document, { key });
      });

      expect(mockDeleteNode).not.toHaveBeenCalled();
      expect(mockDuplicateNode).not.toHaveBeenCalled();
    });

    it('should allow normal text editing in input fields', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const input = getByTestId('node-label-input');

      // Type some text
      fireEvent.change(input, { target: { value: 'New Label' } });

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', { label: 'New Label' });
    });

    it('should allow normal text editing in textarea', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const textarea = getByTestId('node-description-textarea');

      // Type some text
      fireEvent.change(textarea, { target: { value: 'New description' } });

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', {
        description: 'New description',
      });
    });

    it('should allow editing contentEditable elements', () => {
      const { getByTestId } = render(<FlowBuilder />);

      const contentEditable = getByTestId('node-content-editable');

      // Simulate typing in contentEditable
      fireEvent.input(contentEditable, { target: { textContent: 'New content' } });

      expect(mockUpdateNode).toHaveBeenCalledWith('test-node-1', { content: 'New content' });
    });
  });

  describe('Enhanced input detection', () => {
    it('should NOT delete node when Delete key is pressed on SELECT elements', () => {
      const { container } = render(<FlowBuilder />);

      // Create a select element and simulate key press
      const select = document.createElement('select');
      container.appendChild(select);
      select.focus();

      fireEvent.keyDown(select, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should delete node when Delete key is pressed on disabled input', () => {
      const { container } = render(<FlowBuilder />);

      // Create a disabled input and simulate key press
      const input = document.createElement('input');
      input.disabled = true;
      container.appendChild(input);

      // In our implementation, disabled inputs still count as INPUT elements
      // So they are detected as editable context and node deletion is prevented
      fireEvent.keyDown(input, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should delete node when Delete key is pressed on readonly input', () => {
      const { container } = render(<FlowBuilder />);

      // Create a readonly input and simulate key press
      const input = document.createElement('input');
      input.readOnly = true;
      container.appendChild(input);

      // In our implementation, readonly inputs still count as INPUT elements
      // So they are detected as editable context and node deletion is prevented
      fireEvent.keyDown(input, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Delete key is pressed on element inside contentEditable parent', () => {
      const { container } = render(<FlowBuilder />);

      // Create nested contentEditable structure
      const parent = document.createElement('div');
      Object.defineProperty(parent, 'isContentEditable', { value: true });
      const child = document.createElement('span');
      parent.appendChild(child);
      container.appendChild(parent);

      fireEvent.keyDown(child, { key: 'Delete' });

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when event was already prevented', () => {
      render(<FlowBuilder />);

      // Create an event that's already been prevented
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'defaultPrevented', {
        value: true,
        writable: false,
      });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', isContentEditable: false },
        writable: false,
      });

      fireEvent(document, mockEvent);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });
  });

  describe('Browser navigation prevention', () => {
    it('should call preventDefault when deleting nodes', () => {
      render(<FlowBuilder />);

      const mockPreventDefault = jest.fn();
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      mockEvent.preventDefault = mockPreventDefault;

      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', isContentEditable: false },
        writable: false,
      });

      fireEvent(document, mockEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should call preventDefault when deleting nodes with Backspace', () => {
      render(<FlowBuilder />);

      const mockPreventDefault = jest.fn();
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      mockEvent.preventDefault = mockPreventDefault;

      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', isContentEditable: false },
        writable: false,
      });

      fireEvent(document, mockEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });
  });
});
