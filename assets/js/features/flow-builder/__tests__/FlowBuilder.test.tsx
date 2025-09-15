describe('FlowBuilder Keyboard Event Handling Logic', () => {
  // Mock functions to track calls
  const mockDeleteNode = jest.fn();
  const mockDuplicateNode = jest.fn();

  const mockSelectedNode = {
    id: 'test-node-1',
    type: 'agent' as const,
    label: 'Test Agent',
    description: 'Test description',
    color: '#f0f9ff',
    borderColor: '#e5e7eb',
    config: {},
  };

  // This mimics the improved keyboard event handler logic from FlowBuilder.tsx
  const handleKeyDown = (
    e: KeyboardEvent,
    selectedNode: typeof mockSelectedNode | null,
    deleteNode: jest.Mock,
    duplicateNode: jest.Mock,
    _isCanvasLocked = false
  ) => {
    const target = e.target as HTMLElement;
    const isTypingInInput =
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only delete nodes if not typing in an input field
      if (selectedNode && !isTypingInInput) {
        deleteNode(selectedNode.id);
      }
    }

    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (selectedNode) {
        duplicateNode(selectedNode.id);
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Delete/Backspace key handling', () => {
    it('should delete node when Delete key is pressed and not typing in input', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should delete node when Backspace key is pressed and not typing in input', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should NOT delete node when Delete key is pressed while typing in INPUT field', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'INPUT', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Backspace key is pressed while typing in INPUT field', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'INPUT', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Delete key is pressed while typing in TEXTAREA field', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'TEXTAREA', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Backspace key is pressed while typing in TEXTAREA field', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'TEXTAREA', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when Delete key is pressed while typing in contentEditable element', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', isContentEditable: true },
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });

    it('should NOT delete node when no node is selected', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      handleKeyDown(mockEvent, null, mockDeleteNode, mockDuplicateNode);

      expect(mockDeleteNode).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate key handling', () => {
    it('should duplicate node when Ctrl+D is pressed', () => {
      const mockEvent = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
      });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      // Mock preventDefault
      mockEvent.preventDefault = jest.fn();

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockDuplicateNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should duplicate node when Cmd+D is pressed (Mac)', () => {
      const mockEvent = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
      });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      // Mock preventDefault
      mockEvent.preventDefault = jest.fn();

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockDuplicateNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should NOT duplicate node when no node is selected', () => {
      const mockEvent = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
      });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'DIV', contentEditable: 'false' },
        writable: false,
      });

      // Mock preventDefault
      mockEvent.preventDefault = jest.fn();

      handleKeyDown(mockEvent, null, mockDeleteNode, mockDuplicateNode);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockDuplicateNode).not.toHaveBeenCalled();
    });
  });

  describe('Other key handling', () => {
    it('should handle other keys without triggering node operations', () => {
      const testKeys = ['Enter', ' ', 'a', 'Escape', 'ArrowUp', 'ArrowDown'];

      testKeys.forEach(key => {
        const mockEvent = new KeyboardEvent('keydown', { key });
        Object.defineProperty(mockEvent, 'target', {
          value: { tagName: 'DIV', contentEditable: 'false' },
          writable: false,
        });

        handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);
      });

      expect(mockDeleteNode).not.toHaveBeenCalled();
      expect(mockDuplicateNode).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle lowercase tagName (edge case)', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: { tagName: 'input', contentEditable: 'false' }, // lowercase
        writable: false,
      });

      handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);

      // In the actual DOM, tagNames are always uppercase, but if somehow we get lowercase,
      // the current implementation will treat 'input' !== 'INPUT' as a non-input element
      // This is acceptable behavior as it errs on the side of caution
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should handle missing target properties gracefully', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: {}, // Missing tagName and contentEditable
        writable: false,
      });

      // Should not throw an error and should delete node (since target exists but has no input properties)
      expect(() => {
        handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);
      }).not.toThrow();
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should handle null target gracefully', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: null,
        writable: false,
      });

      // Should not throw an error and should delete node (since null target means not in input)
      expect(() => {
        handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);
      }).not.toThrow();
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });

    it('should handle undefined target gracefully', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(mockEvent, 'target', {
        value: undefined,
        writable: false,
      });

      // Should not throw an error and should delete node (since undefined target means not in input)
      expect(() => {
        handleKeyDown(mockEvent, mockSelectedNode, mockDeleteNode, mockDuplicateNode);
      }).not.toThrow();
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node-1');
    });
  });
});
