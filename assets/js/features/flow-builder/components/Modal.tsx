import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'default' | 'large';
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'default', children }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  const modalClassName = size === 'large' 
    ? 'flow-builder__modal flow-builder__modal--large'
    : 'flow-builder__modal';

  return (
    <div className="flow-builder__modal-backdrop" onClick={handleBackdropClick}>
      <div className={modalClassName} onClick={(e) => e.stopPropagation()}>
        <div className="flow-builder__modal-header">
          <div className="flow-builder__modal-title">
            <span className="flow-builder__modal-title-text">{title}</span>
          </div>
          <button 
            className="flow-builder__modal-close" 
            aria-label="Close" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="flow-builder__modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}