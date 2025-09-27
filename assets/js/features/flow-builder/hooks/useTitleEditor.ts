import { useState } from 'react';

interface Flow {
  title: string;
  id: string;
}

interface UseTitleEditorProps {
  currentFlow: Flow | null;
  updateFlowTitle: (_title: string) => void;
}

export function useTitleEditor({ currentFlow, updateFlowTitle }: UseTitleEditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEditingTitle = () => {
    if (currentFlow) {
      setEditingTitle(currentFlow.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim() && currentFlow) {
      updateFlowTitle(editingTitle.trim());
    }
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  return {
    isEditingTitle,
    editingTitle,
    setEditingTitle,
    handleStartEditingTitle,
    handleSaveTitle,
    handleCancelEditingTitle,
  };
}
