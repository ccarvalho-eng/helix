import { Cpu, Menu, Sliders, Circle, Zap, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { DownloadButton } from '../DownloadButton';

interface FlowHeaderProps {
  currentFlow: { title: string; id: string } | null;
  nodes: any[];
  edges: any[];
  isFlowReady: boolean;
  isConnected: boolean;
  isMobile: boolean;
  isPaletteOpen: boolean;
  isPropertiesOpen: boolean;
  isMobileStatsOpen: boolean;
  isEditingTitle: boolean;
  editingTitle: string;
  onTogglePalette: () => void;
  onToggleProperties: () => void;
  onToggleMobileStats: () => void;
  onEditTitle: () => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  onEditingTitleChange: (_title: string) => void;
  onLogout: () => void;
}

export function FlowHeader({
  currentFlow,
  nodes,
  edges,
  isFlowReady,
  isConnected,
  isMobile,
  isPaletteOpen,
  isPropertiesOpen,
  isMobileStatsOpen,
  isEditingTitle,
  editingTitle,
  onTogglePalette,
  onToggleProperties,
  onToggleMobileStats,
  onEditTitle,
  onSaveTitle,
  onCancelEdit,
  onEditingTitleChange,
  onLogout,
}: FlowHeaderProps) {
  return (
    <div className='flow-builder__header'>
      <div className='flow-builder__header-left'>
        <div className='flow-builder__brand'>
          <Cpu className='flow-builder__brand-icon' />
          <span className='flow-builder__brand-text'>Helix</span>
        </div>

        {isEditingTitle ? (
          <input
            type='text'
            value={editingTitle}
            onChange={e => onEditingTitleChange(e.target.value)}
            onBlur={onSaveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') onSaveTitle();
              if (e.key === 'Escape') onCancelEdit();
            }}
            className='flow-builder__title-input'
            autoFocus
          />
        ) : (
          <h1 className='flow-builder__title' onClick={onEditTitle}>
            {currentFlow?.title || 'Untitled Flow'}
          </h1>
        )}

        {!isMobile && (
          <div className='flow-builder__stats'>
            <div className='flow-builder__stat'>
              <Circle size={14} />
              {nodes.length} nodes
            </div>
            <div className='flow-builder__stat'>
              <Zap size={14} />
              {edges.length} connections
            </div>
            {!isFlowReady && (
              <div className='flow-builder__stat flow-builder__stat--connecting'>
                <Circle size={14} />
                Connecting...
              </div>
            )}
            {isFlowReady && isConnected && (
              <div className='flow-builder__stat flow-builder__stat--connected'>
                <Circle size={14} />
                Live
              </div>
            )}
          </div>
        )}
      </div>

      <div className='flow-builder__header-right'>
        {isMobile ? (
          <>
            <button
              className={`flow-builder__mobile-btn ${isPaletteOpen ? 'flow-builder__mobile-btn--active' : ''}`}
              onClick={onTogglePalette}
              title='Toggle node palette'
              aria-label='Toggle node palette'
            >
              <Menu size={16} />
            </button>
            <button
              className={`flow-builder__mobile-btn ${isPropertiesOpen ? 'flow-builder__mobile-btn--active' : ''}`}
              onClick={onToggleProperties}
              title='Toggle properties panel'
              aria-label='Toggle properties panel'
            >
              <Sliders size={16} />
            </button>
            <button
              className='flow-builder__mobile-stats-btn'
              onClick={onToggleMobileStats}
              title='Toggle stats'
              aria-label='Toggle stats'
            >
              <span className='flow-builder__mobile-stats-btn-text'>
                {nodes.length}n {edges.length}c
              </span>
              {isMobileStatsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <DownloadButton
              filename={currentFlow?.title.toLowerCase().replace(/\s+/g, '-') || 'flow-diagram'}
            />
            <ThemeToggle />
            <button
              className='flow-builder__logout-btn'
              onClick={onLogout}
              title='Logout'
              aria-label='Logout'
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              className={`flow-builder__toggle-btn ${isPaletteOpen ? 'flow-builder__toggle-btn--active' : ''}`}
              onClick={onTogglePalette}
              title='Toggle node palette'
              aria-label='Toggle node palette'
            >
              <Menu size={16} />
              Palette
            </button>
            <button
              className={`flow-builder__toggle-btn ${isPropertiesOpen ? 'flow-builder__toggle-btn--active' : ''}`}
              onClick={onToggleProperties}
              title='Toggle properties panel'
              aria-label='Toggle properties panel'
            >
              <Sliders size={16} />
              Properties
            </button>
            <DownloadButton
              filename={currentFlow?.title.toLowerCase().replace(/\s+/g, '-') || 'flow-diagram'}
            />
            <ThemeToggle />
            <button
              className='flow-builder__logout-btn'
              onClick={onLogout}
              title='Logout'
              aria-label='Logout'
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>

      {/* Mobile expandable stats/controls */}
      {isMobile && isMobileStatsOpen && (
        <div className='flow-builder__mobile-stats-panel'>
          <div className='flow-builder__mobile-stats-panel__stats'>
            <div className='flow-builder__mobile-stats-panel__stat'>
              <Circle size={14} />
              {nodes.length} nodes
            </div>
            <div className='flow-builder__mobile-stats-panel__stat'>
              <Zap size={14} />
              {edges.length} connections
            </div>
            {!isFlowReady && (
              <div className='flow-builder__mobile-stats-panel__stat flow-builder__mobile-stats-panel__stat--connecting'>
                <Circle size={14} />
                Connecting...
              </div>
            )}
            {isFlowReady && isConnected && (
              <div className='flow-builder__mobile-stats-panel__stat flow-builder__mobile-stats-panel__stat--connected'>
                <Circle size={14} />
                Live
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
