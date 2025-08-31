import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = `custom-select-listbox-${React.useId()}`;
  const triggerId = `custom-select-trigger-${React.useId()}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        // Open dropdown on Enter or Space when closed
        if ((event.key === 'Enter' || event.key === ' ') && event.target === triggerRef.current) {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          setSearchTerm('');
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Home':
          event.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex]);
            setIsOpen(false);
            setHighlightedIndex(-1);
            setSearchTerm('');
          }
          break;
        default:
          // Type-ahead search
          if (event.key.length === 1) {
            const newSearchTerm = searchTerm + event.key.toLowerCase();
            const matchingIndex = options.findIndex(option =>
              option.toLowerCase().startsWith(newSearchTerm)
            );
            if (matchingIndex !== -1) {
              setHighlightedIndex(matchingIndex);
              setSearchTerm(newSearchTerm);
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, options, onChange, searchTerm]);

  // Clear search term after timeout
  useEffect(() => {
    if (searchTerm) {
      const timeout = setTimeout(() => setSearchTerm(''), 1000);
      return () => clearTimeout(timeout);
    }
  }, [searchTerm]);

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const displayValue = value || placeholder;

  return (
    <div className={`custom-select ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type='button'
        id={triggerId}
        className={`custom-select__trigger ${isOpen ? 'custom-select__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
      >
        <span
          className={`custom-select__value ${!value ? 'custom-select__value--placeholder' : ''}`}
        >
          {displayValue}
        </span>
        <ChevronDown
          size={18}
          className={`custom-select__chevron ${isOpen ? 'custom-select__chevron--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className='custom-select__dropdown'>
          <ul 
            className='custom-select__options' 
            role='listbox'
            id={listboxId}
            aria-labelledby={triggerId}
          >
            {options.map((option, index) => (
              <li
                key={option}
                id={`${listboxId}-option-${index}`}
                role='option'
                aria-selected={option === value}
                className={`custom-select__option ${
                  option === value ? 'custom-select__option--selected' : ''
                } ${index === highlightedIndex ? 'custom-select__option--highlighted' : ''}`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
