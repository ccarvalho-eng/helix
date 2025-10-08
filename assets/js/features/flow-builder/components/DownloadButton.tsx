import { Image, Loader2 } from 'lucide-react';
import { useDownloadImage } from '../hooks/useDownloadImage';
import { useThemeContext } from '../contexts/ThemeContext';

interface DownloadButtonProps {
  filename?: string;
}

export function DownloadButton({ filename = 'flow-diagram' }: DownloadButtonProps) {
  const { downloadImage, isDownloading } = useDownloadImage();
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };

  const handleDownload = async () => {
    await downloadImage(filename, theme);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`flow-builder__download-btn ${isDownloading ? 'flow-builder__download-btn--downloading' : ''}`}
      aria-label={isDownloading ? 'Downloading...' : 'Download flow as PNG'}
      title={isDownloading ? 'Downloading...' : 'Export flow as PNG image'}
    >
      {isDownloading ? <Loader2 size={18} className='animate-spin' /> : <Image size={18} />}
    </button>
  );
}
