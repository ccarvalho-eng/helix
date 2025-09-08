import React from 'react';
import { Download, Loader2 } from 'lucide-react';
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
      className={`download-button ${isDownloading ? 'downloading' : ''}`}
      aria-label={isDownloading ? 'Downloading...' : 'Download flow as PNG'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        border: `1px solid ${theme === 'dark' ? 'var(--theme-border-primary, #3e4451)' : '#d1d5db'}`,
        borderRadius: '6px',
        backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary, #21252b)' : '#ffffff',
        color: theme === 'dark' ? 'var(--theme-text-primary, #abb2bf)' : '#374151',
        cursor: isDownloading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        opacity: isDownloading ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        if (!isDownloading) {
          e.currentTarget.style.backgroundColor =
            theme === 'dark' ? 'var(--theme-bg-tertiary, #32363e)' : '#f9fafb';
        }
      }}
      onMouseLeave={e => {
        if (!isDownloading) {
          e.currentTarget.style.backgroundColor =
            theme === 'dark' ? 'var(--theme-bg-secondary, #21252b)' : '#ffffff';
        }
      }}
    >
      {isDownloading ? <Loader2 size={16} className='animate-spin' /> : <Download size={16} />}
      {isDownloading ? 'Downloading...' : 'Download'}
    </button>
  );
}
