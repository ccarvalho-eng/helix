import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, Image } from 'lucide-react';
import { useDownloadImage } from '../hooks/useDownloadImage';
import { useThemeContext } from '../contexts/ThemeContext';

interface DownloadButtonProps {
  filename?: string;
}

export function DownloadButton({ filename = 'flow-diagram' }: DownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { downloadImage, downloadImageWithBackground, isDownloading } = useDownloadImage();
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setIsOpen(!isOpen);
    }
  };

  const handleDownloadTransparent = async () => {
    await downloadImage(filename);
    setIsOpen(false);
  };

  const handleDownloadWithBackground = async () => {
    await downloadImageWithBackground(filename);
    setIsOpen(false);
  };

  return (
    <div className='download-button-container' style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isDownloading}
        className={`download-button ${isDownloading ? 'downloading' : ''}`}
        aria-label={isDownloading ? 'Downloading...' : 'Download flow as image'}
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

      {isOpen && !isDownloading && (
        <div
          ref={dropdownRef}
          className='download-dropdown'
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: '0',
            minWidth: '200px',
            backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary, #21252b)' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? 'var(--theme-border-primary, #3e4451)' : '#d1d5db'}`,
            borderRadius: '8px',
            boxShadow:
              theme === 'dark'
                ? 'var(--theme-shadow, 0 4px 12px rgba(0, 0, 0, 0.3))'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            padding: '8px',
          }}
        >
          <button
            onClick={handleDownloadTransparent}
            className='download-option'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: theme === 'dark' ? 'var(--theme-text-primary, #abb2bf)' : '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                theme === 'dark' ? 'var(--theme-bg-tertiary, #32363e)' : '#f9fafb';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Image
              size={16}
              style={{ color: theme === 'dark' ? 'var(--theme-syntax-blue, #61afef)' : '#3b82f6' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>PNG (Transparent)</div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? 'var(--theme-text-secondary, #798294)' : '#6b7280',
                  marginTop: '2px',
                }}
              >
                Download with transparent background
              </div>
            </div>
          </button>

          <button
            onClick={handleDownloadWithBackground}
            className='download-option'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: theme === 'dark' ? 'var(--theme-text-primary, #abb2bf)' : '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                theme === 'dark' ? 'var(--theme-bg-tertiary, #32363e)' : '#f9fafb';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Image
              size={16}
              style={{ color: theme === 'dark' ? 'var(--theme-syntax-green, #98c379)' : '#10b981' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>PNG (With Background)</div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? 'var(--theme-text-secondary, #798294)' : '#6b7280',
                  marginTop: '2px',
                }}
              >
                Download with white background
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
