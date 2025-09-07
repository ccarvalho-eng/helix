import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import html2canvas from 'html2canvas';

interface UseDownloadImageReturn {
  // eslint-disable-next-line no-unused-vars
  downloadImage: (filename?: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  downloadImageWithBackground: (filename?: string) => Promise<void>;
  isDownloading: boolean;
}

export function useDownloadImage(): UseDownloadImageReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const { getViewport, setViewport, getNodes, fitView } = useReactFlow();

  const downloadImage = useCallback(
    async (filename = 'flow-diagram') => {
      setIsDownloading(true);

      try {
        const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
        if (!reactFlowElement) {
          throw new Error('React Flow element not found');
        }

        const originalViewport = getViewport();

        const nodes = getNodes();
        if (nodes.length === 0) {
          throw new Error('No nodes to capture');
        }

        await new Promise(resolve => {
          fitView({
            padding: 0.1, // 10% padding around the diagram
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 3,
            duration: 0, // No animation
          });

          setTimeout(resolve, 300);
        });

        const canvas = await html2canvas(reactFlowElement, {
          backgroundColor: null, // Transparent background
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          removeContainer: true,
        });

        setViewport(originalViewport, { duration: 0 });

        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error downloading image:', error);
      } finally {
        setIsDownloading(false);
      }
    },
    [getViewport, setViewport, getNodes, fitView]
  );

  const downloadImageWithBackground = useCallback(
    async (filename = 'flow-diagram') => {
      setIsDownloading(true);

      try {
        const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
        if (!reactFlowElement) {
          throw new Error('React Flow element not found');
        }

        const originalViewport = getViewport();

        const nodes = getNodes();
        if (nodes.length === 0) {
          throw new Error('No nodes to capture');
        }

        await new Promise(resolve => {
          fitView({
            padding: 0.1, // 10% padding around the diagram
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 3,
            duration: 0, // No animation
          });

          setTimeout(resolve, 300);
        });

        const canvas = await html2canvas(reactFlowElement, {
          backgroundColor: '#ffffff', // White background
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          removeContainer: true,
        });

        setViewport(originalViewport, { duration: 0 });

        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error downloading image:', error);
      } finally {
        setIsDownloading(false);
      }
    },
    [getViewport, setViewport, getNodes, fitView]
  );

  return {
    downloadImage,
    downloadImageWithBackground,
    isDownloading,
  };
}
