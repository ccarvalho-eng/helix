import React from 'react';
import { Cpu, Plus, FolderOpen, Clock, Settings, Search, Filter } from 'lucide-react';
import { ThemeToggle } from '../flow-builder/components/ThemeToggle';

export const HomePage: React.FC = () => {
  const handleCreateWorkflow = () => {
    window.location.href = '/flow';
  };

  return (
    <div className='home-page'>
      {/* Header with Logo and Navigation */}
      <div className='home-header'>
        <div className='home-header__content'>
          <div className='home-header__brand'>
            <Cpu className='home-header__logo' />
            <h1 className='home-header__title'>Helix</h1>
            <span className='home-header__subtitle'>AI Flow Builder</span>
          </div>

          <div className='home-header__actions'>
            <button onClick={handleCreateWorkflow} className='home-header__create-btn'>
              <Plus className='home-header__create-icon' />
              New Flow
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='home-main'>
        <div className='home-main__content'>
          {/* Quick Actions */}
          <div className='home-quick-actions'>
            <button onClick={handleCreateWorkflow} className='home-quick-action'>
              <Plus className='home-quick-action__icon' />
              <div className='home-quick-action__content'>
                <h3 className='home-quick-action__title'>Create New Flow</h3>
                <p className='home-quick-action__desc'>Start building a new workflow diagram</p>
              </div>
            </button>

            <div className='home-quick-action'>
              <FolderOpen className='home-quick-action__icon' />
              <div className='home-quick-action__content'>
                <h3 className='home-quick-action__title'>Browse Templates</h3>
                <p className='home-quick-action__desc'>Choose from pre-built workflow templates</p>
              </div>
            </div>
          </div>

          {/* Workflow Management Section */}
          <div className='home-workflows'>
            <div className='home-workflows__header'>
              <div className='home-workflows__title-section'>
                <h2 className='home-workflows__title'>My Workflows</h2>
                <span className='home-workflows__count'>3 flows</span>
              </div>

              <div className='home-workflows__controls'>
                <div className='home-workflows__search'>
                  <Search className='home-workflows__search-icon' />
                  <input
                    type='text'
                    placeholder='Search workflows...'
                    className='home-workflows__search-input'
                  />
                </div>
                <button className='home-workflows__filter-btn'>
                  <Filter className='home-workflows__filter-icon' />
                  Filter
                </button>
              </div>
            </div>

            <div className='home-workflows__grid'>
              <div className='home-workflow-card' onClick={() => (window.location.href = '/flow')}>
                <div className='home-workflow-card__header'>
                  <div className='home-workflow-card__info'>
                    <h3 className='home-workflow-card__title'>Customer Support Pipeline</h3>
                    <div className='home-workflow-card__meta'>
                      <Clock className='home-workflow-card__meta-icon' />
                      <span>Last edited 2 days ago</span>
                    </div>
                  </div>
                  <button
                    className='home-workflow-card__menu'
                    type='button'
                    aria-label='Open workflow menu'
                  >
                    <Settings className='home-workflow-card__menu-icon' />
                  </button>
                </div>

                <p className='home-workflow-card__description'>
                  Automated customer support flow with ticket routing, AI responses, and escalation
                  handling
                </p>

                <div className='home-workflow-card__footer'>
                  <div className='home-workflow-card__stats'>
                    <span className='home-workflow-card__stat'>12 nodes</span>
                    <span className='home-workflow-card__stat'>3 integrations</span>
                    <span className='home-workflow-card__stat'>Active</span>
                  </div>
                  <div className='home-workflow-card__status home-workflow-card__status--active'></div>
                </div>
              </div>

              <div className='home-workflow-card' onClick={() => (window.location.href = '/flow')}>
                <div className='home-workflow-card__header'>
                  <div className='home-workflow-card__info'>
                    <h3 className='home-workflow-card__title'>Data Processing Flow</h3>
                    <div className='home-workflow-card__meta'>
                      <Clock className='home-workflow-card__meta-icon' />
                      <span>Last edited 1 week ago</span>
                    </div>
                  </div>
                  <button className='home-workflow-card__menu'>
                    <Settings className='home-workflow-card__menu-icon' />
                  </button>
                </div>

                <p className='home-workflow-card__description'>
                  ETL pipeline for processing customer data with validation, transformation, and
                  storage
                </p>

                <div className='home-workflow-card__footer'>
                  <div className='home-workflow-card__stats'>
                    <span className='home-workflow-card__stat'>8 nodes</span>
                    <span className='home-workflow-card__stat'>2 integrations</span>
                    <span className='home-workflow-card__stat'>Draft</span>
                  </div>
                  <div className='home-workflow-card__status home-workflow-card__status--draft'></div>
                </div>
              </div>

              <div className='home-empty-card' onClick={handleCreateWorkflow}>
                <Plus className='home-empty-card__icon' />
                <h3 className='home-empty-card__title'>Create New Workflow</h3>
                <p className='home-empty-card__text'>
                  Design a new flow diagram to automate your processes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
