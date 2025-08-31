import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (_color: string) => void;
  label: string;
  showAlpha?: boolean;
}

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#6b7280',
  '#374151',
  '#111827',
  '#000000',
  '#ffffff',
  '#f8fafc',
];

export function ColorPicker({ value, onChange, label, showAlpha = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Clean the color value for display (remove alpha if present)
  const cleanValue = value.length === 9 ? value.slice(0, 7) : value;
  const [customColor, setCustomColor] = useState(cleanValue);

  // Sync customColor with value changes
  useEffect(() => {
    setCustomColor(cleanValue);
  }, [cleanValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleColorSelect = (_color: string) => {
    const finalColor =
      showAlpha && !_color.includes('#ffffff') && !_color.includes('#000000')
        ? _color + '20'
        : _color;
    onChange(finalColor);
    setCustomColor(_color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _color = e.target.value;
    setCustomColor(_color);
    const finalColor = showAlpha ? _color + '20' : _color;
    onChange(finalColor);
  };

  const openColorPicker = () => {
    hiddenInputRef.current?.click();
  };

  return (
    <div className='color-picker' ref={containerRef}>
      <label className='properties-panel__label'>{label}</label>
      <div className='color-picker__wrapper'>
        <button className='color-picker__trigger' onClick={() => setIsOpen(!isOpen)} type='button'>
          <div className='color-picker__preview' style={{ backgroundColor: cleanValue }} />
          <span className='color-picker__value'>{cleanValue.toUpperCase()}</span>
          <svg className='color-picker__chevron' width='12' height='12' viewBox='0 0 12 12'>
            <path
              d='M3 4.5L6 7.5L9 4.5'
              stroke='currentColor'
              strokeWidth='1.5'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </button>

        {isOpen && (
          <div className='color-picker__dropdown'>
            <div className='color-picker__presets'>
              <div className='color-picker__section-title'>Presets</div>
              <div className='color-picker__preset-grid'>
                {PRESET_COLORS.map(_color => (
                  <button
                    key={_color}
                    className={`color-picker__preset-item ${cleanValue === _color ? 'color-picker__preset-item--selected' : ''}`}
                    style={{ backgroundColor: _color }}
                    onClick={() => handleColorSelect(_color)}
                    type='button'
                    aria-label={`Select ${_color}`}
                  />
                ))}
              </div>
            </div>

            <div className='color-picker__custom'>
              <div className='color-picker__section-title'>Custom</div>
              <div className='color-picker__custom-wrapper'>
                <button
                  className='color-picker__custom-trigger'
                  onClick={openColorPicker}
                  type='button'
                >
                  <div
                    className='color-picker__custom-preview'
                    style={{ backgroundColor: customColor }}
                  />
                  <span>Pick custom color</span>
                </button>
                <input
                  ref={hiddenInputRef}
                  type='color'
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className='color-picker__hidden-input'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
