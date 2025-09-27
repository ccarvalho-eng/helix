import { useEffect } from 'react';

interface UseOutsideClickProps {
  isMobileStatsOpen: boolean;
  setIsMobileStatsOpen: (_open: boolean) => void;
}

export function useOutsideClick({ isMobileStatsOpen, setIsMobileStatsOpen }: UseOutsideClickProps) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isMobileStatsOpen &&
        !target.closest('.flow-builder__mobile-stats-panel') &&
        !target.closest('.flow-builder__mobile-stats-toggle')
      ) {
        setIsMobileStatsOpen(false);
      }
    };

    if (isMobileStatsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileStatsOpen, setIsMobileStatsOpen]);
}
