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

      try {
        const nodes = getNodes();

        if (nodes.length === 0) {
          throw new Error('No nodes to capture');
        }

        const originalSelectedNodes = nodes.filter(node => node.selected);
        if (originalSelectedNodes.length > 0) {
          setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));
        }

        const originalViewport = getViewport();

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
          const x = node.position.x;
          const y = node.position.y;
          const width = node.width || 100;
          const height = node.height || 60;

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

        const viewportTransform = {
          x: -minX * pixelRatio,
          y: -minY * pixelRatio,
          zoom: pixelRatio,
        };

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
            transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.zoom})`,
          },
        });

        if (originalSelectedNodes.length > 0) {
          setNodes(nodes =>
            nodes.map(node => ({
              ...node,
              selected: originalSelectedNodes.some(selectedNode => selectedNode.id === node.id),
            }))
          );
        }

        setViewport(originalViewport, { duration: 0 });

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error downloading image:', error);
      } finally {
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
