import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  selectedNode: any;
  deleteNode: (_id: string) => void;
  duplicateNode: (_id: string) => void;
  isCanvasLocked: boolean;
  setIsCanvasLocked: (_locked: boolean) => void;
  setIsPaletteOpen: (_open: boolean) => void;
  setIsPropertiesOpen: (_open: boolean) => void;
  setIsTemplatesModalOpen: (_open: boolean) => void;
  setIsMobileStatsOpen: (_open: boolean) => void;
}

export function useKeyboardShortcuts({
  selectedNode,
  deleteNode,
  duplicateNode,
  isCanvasLocked,
  setIsCanvasLocked,
  setIsPaletteOpen,
  setIsPropertiesOpen,
  setIsTemplatesModalOpen,
  setIsMobileStatsOpen,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an editable context
      const target = e.target as HTMLElement;

      // Comprehensive check for editable contexts
      const isInEditableContext = () => {
        if (!target) return false;

        // Check direct element
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return true;
        }

        // Check for readonly/disabled states (these shouldn't prevent deletion)
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          if (target.readOnly || target.disabled) return false;
        }

        // Traverse up to check for contentEditable parents
        let element = target.parentElement;
        while (element) {
          if (element.isContentEditable) return true;
          element = element.parentElement;
        }

        return false;
      };

      // Delete/Backspace - Delete selected node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode && !isInEditableContext() && !e.defaultPrevented) {
          e.preventDefault(); // Prevent browser navigation
          deleteNode(selectedNode.id);
        }
      }

      // Ctrl/Cmd + D - Duplicate selected node
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedNode) {
          duplicateNode(selectedNode.id);
        }
      }

      // Escape - Close all panels/modals
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsPropertiesOpen(false);
        setIsTemplatesModalOpen(false);
        setIsMobileStatsOpen(false);
      }

      // Ctrl/Cmd + Shift + L - Toggle canvas lock
      if (e.key === 'L' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsCanvasLocked(!isCanvasLocked);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNode,
    deleteNode,
    duplicateNode,
    isCanvasLocked,
    setIsCanvasLocked,
    setIsPaletteOpen,
    setIsPropertiesOpen,
    setIsTemplatesModalOpen,
    setIsMobileStatsOpen,
  ]);
}
