import { useState, useEffect } from 'react';

export function useUIState() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    | 'business-automation'
    | 'customer-service'
    | 'content-creation'
    | 'data-analysis'
    | 'healthcare'
    | 'finance'
    | 'e-commerce'
  >('business-automation');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  // Handle mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);

    return () => {
      mq.removeEventListener('change', update);
    };
  }, []);

  // Handle URL templates parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('templates') === 'true') {
      setIsTemplatesModalOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  return {
    // State
    isPaletteOpen,
    isPropertiesOpen,
    isMobile,
    modalNodeId,
    isTemplatesModalOpen,
    activeTemplateTab,
    isCanvasLocked,
    isMobileStatsOpen,

    // Actions
    setIsPaletteOpen,
    setIsPropertiesOpen,
    setModalNodeId,
    setIsTemplatesModalOpen,
    setActiveTemplateTab,
    setIsCanvasLocked,
    setIsMobileStatsOpen,
  };
}
