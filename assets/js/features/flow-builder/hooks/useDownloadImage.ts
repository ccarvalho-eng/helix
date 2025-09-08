import { useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { toPng } from 'html-to-image';

interface UseDownloadImageReturn {
  // eslint-disable-next-line no-unused-vars
  downloadImage: (filename?: string, theme?: string) => Promise<void>;
  isDownloading: boolean;
}

export function useDownloadImage(): UseDownloadImageReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const { getViewport, setViewport, getNodes, setNodes } = useReactFlow();

  const downloadImage = useCallback(
    async (filename = 'flow-diagram', theme = 'light') => {
      setIsDownloading(true);

      let originalSelectedNodes: ReturnType<typeof getNodes> = [];
      let originalViewport: ReturnType<typeof getViewport> | null = null;

      try {
        const nodes = getNodes();

        if (nodes.length === 0) {
          throw new Error('No nodes to capture');
        }

        // Store original state for restoration
        originalSelectedNodes = nodes.filter(node => node.selected);
        originalViewport = getViewport();

        // Clear selection for clean export
        if (originalSelectedNodes.length > 0) {
          setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));
        }

        // Calculate bounds using accurate node dimensions
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
          const x = node.position.x;
          const y = node.position.y;
          // Use actual dimensions first, then fallback to defaults
          const width = node.width || node.data?.width || 100;
          const height = node.height || node.data?.height || 60;

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + width);
          maxY = Math.max(maxY, y + height);
        });

        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;
        const pixelRatio = 2;
        const scaledWidth = width * pixelRatio;
        const scaledHeight = height * pixelRatio;

        const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportElement) {
          throw new Error('React Flow viewport not found');
        }

        const backgroundColor = theme === 'dark' ? '#21252b' : '#ffffff';

        const dataUrl = await toPng(viewportElement, {
          backgroundColor,
          width: scaledWidth,
          height: scaledHeight,
          pixelRatio,
          style: {
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            transform: `translate(${-minX * pixelRatio}px, ${-minY * pixelRatio}px) scale(${pixelRatio})`,
          },
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error downloading image:', error);
      } finally {
        // Always restore original state
        if (originalSelectedNodes.length > 0) {
          setNodes(nodes =>
            nodes.map(node => ({
              ...node,
              selected: originalSelectedNodes.some(selectedNode => selectedNode.id === node.id),
            }))
          );
        }

        if (originalViewport) {
          setViewport(originalViewport, { duration: 0 });
        }

        setIsDownloading(false);
      }
    },
    [getViewport, setViewport, getNodes, setNodes]
  );

  return {
    downloadImage,
    isDownloading,
  };
}
