import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import html2canvas from 'html2canvas';

interface UseDownloadImageReturn {
  // eslint-disable-next-line no-unused-vars
  downloadImage: (filename?: string, theme?: string) => Promise<void>;
  isDownloading: boolean;
}

export function useDownloadImage(): UseDownloadImageReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const { getViewport, setViewport, getNodes, fitView, setNodes } = useReactFlow();

  const downloadImage = useCallback(
    async (filename = 'flow-diagram', theme = 'light') => {
      setIsDownloading(true);

      try {
        const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
        if (!reactFlowElement) {
          throw new Error('React Flow element not found');
        }

        const originalViewport = getViewport();

        // Clear selection and store original selection state
        const nodes = getNodes();
        const originalSelectedNodes = nodes.filter(node => node.selected);

        if (originalSelectedNodes.length > 0) {
          setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));
        }
        if (nodes.length === 0) {
          throw new Error('No nodes to capture');
        }

        await new Promise(resolve => {
          fitView({
            padding: 0.1,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 3,
            duration: 0,
          });

          setTimeout(resolve, 300);
        });

        // Hide UI elements during capture
        const controlsElement = reactFlowElement.querySelector(
          '.react-flow__controls'
        ) as HTMLElement;
        const minimapElement = reactFlowElement.querySelector(
          '.react-flow__minimap'
        ) as HTMLElement;
        const attributionElement = reactFlowElement.querySelector(
          '.react-flow__attribution'
        ) as HTMLElement;

        const originalControlsDisplay = controlsElement?.style?.display;
        const originalMinimapDisplay = minimapElement?.style?.display;
        const originalAttributionDisplay = attributionElement?.style?.display;

        if (controlsElement) controlsElement.style.display = 'none';
        if (minimapElement) minimapElement.style.display = 'none';
        if (attributionElement) attributionElement.style.display = 'none';

        const backgroundColor = theme === 'dark' ? '#21252b' : '#ffffff';

        const canvas = await html2canvas(reactFlowElement, {
          backgroundColor,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          removeContainer: true,
        });

        // Restore UI elements
        if (controlsElement) controlsElement.style.display = originalControlsDisplay || '';
        if (minimapElement) minimapElement.style.display = originalMinimapDisplay || '';
        if (attributionElement) attributionElement.style.display = originalAttributionDisplay || '';

        // Restore original selection
        if (originalSelectedNodes.length > 0) {
          setNodes(nodes =>
            nodes.map(node => ({
              ...node,
              selected: originalSelectedNodes.some(selectedNode => selectedNode.id === node.id),
            }))
          );
        }

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
    [getViewport, setViewport, getNodes, setNodes, fitView]
  );

  return {
    downloadImage,
    isDownloading,
  };
}
