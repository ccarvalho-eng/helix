import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadButton } from '../DownloadButton';

// Mock the useDownloadImage hook
const mockDownloadImage = jest.fn();

// Create a mock function that can be configured per test
const mockUseDownloadImage = jest.fn(() => ({
  downloadImage: mockDownloadImage,
  isDownloading: false,
}));

jest.mock('../../hooks/useDownloadImage', () => ({
  useDownloadImage: () => mockUseDownloadImage(),
}));

// Create a mock function that can be configured per test
const mockUseThemeContext = jest.fn(() => ({ theme: 'light' }));

jest.mock('../../contexts/ThemeContext', () => ({
  useThemeContext: () => mockUseThemeContext(),
}));

describe('DownloadButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default values
    mockUseDownloadImage.mockReturnValue({
      downloadImage: mockDownloadImage,
      isDownloading: false,
    });
    mockUseThemeContext.mockReturnValue({ theme: 'light' });
  });

  it('renders download button with correct text', () => {
    render(<DownloadButton />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders with custom filename prop', () => {
    render(<DownloadButton filename="custom-flow" />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls downloadImage with correct parameters when clicked', async () => {
    render(<DownloadButton filename="test-flow" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadImage).toHaveBeenCalledWith('test-flow', 'light');
    });
  });

  it('uses default filename when none provided', async () => {
    render(<DownloadButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadImage).toHaveBeenCalledWith('flow-diagram', 'light');
    });
  });

  it('has correct aria-label', () => {
    render(<DownloadButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Download flow as PNG');
  });

  it('renders download icon', () => {
    render(<DownloadButton />);
    
    // The Lucide Download component should be rendered
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls downloadImage with dark theme', async () => {
    mockUseThemeContext.mockReturnValue({ theme: 'dark' });
    
    render(<DownloadButton filename="dark-flow" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadImage).toHaveBeenCalledWith('dark-flow', 'dark');
    });
  });

  it('defaults to light theme when context is null', async () => {
    mockUseThemeContext.mockReturnValue(null);
    
    render(<DownloadButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadImage).toHaveBeenCalledWith('flow-diagram', 'light');
    });
  });

  it('shows loading state when downloading', () => {
    mockUseDownloadImage.mockReturnValue({
      downloadImage: mockDownloadImage,
      isDownloading: true,
    });
    
    render(<DownloadButton />);
    
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has correct aria-label when downloading', () => {
    mockUseDownloadImage.mockReturnValue({
      downloadImage: mockDownloadImage,
      isDownloading: true,
    });
    
    render(<DownloadButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Downloading...');
  });
});