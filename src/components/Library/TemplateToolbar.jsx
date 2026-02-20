/**
 * TemplateToolbar Component
 * Toolbar for library management actions
 * TAB-LIB-03, TAB-LIB-04, TAB-LIB-05, TAB-LIB-06
 */

import { useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Icon from '../common/Icon'

function TemplateToolbar({
  onNewTemplate,
  onExport,
  onImport,
  onSearch,
  onFilter,
  onSort,
  onViewModeChange,
  searchQuery,
  sortBy,
  viewMode
}) {
  const fileInputRef = useRef(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    onImport(event)
    // Reset input so the same file can be imported again
    event.target.value = ''
  }

  return (
    <div className='library-toolbar'>
      {/* Primary actions */}
      <div className='toolbar-primary'>
        <button type="button"
          className='btn btn-primary'
          onClick={onNewTemplate}
          aria-label='Create new template'
        >
          <Icon name='plus' />
          <span>New Template</span>
        </button>

        <button type="button"
          className='btn'
          onClick={handleImportClick}
          aria-label='Import templates'
        >
          <Icon name='upload' />
          <span>Import</span>
        </button>
        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label='Choose template file to import'
        />

        <button type="button"
          className='btn'
          onClick={onExport}
          aria-label='Export all templates'
        >
          <Icon name='download' />
          <span>Export</span>
        </button>
      </div>

      {/* Search and filter */}
      <div className='toolbar-search'>
        <div className='search-box'>
          <Icon name='search' />
          <input
            type='text'
            placeholder='Search templates...'
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            aria-label='Search templates'
          />
        </div>

        <button type="button"
          className='btn'
          onClick={onFilter}
          aria-label='Filter templates'
        >
          <Icon name='filter' />
          <span>Filter</span>
        </button>

        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
          className='sort-select'
          aria-label='Sort templates'
        >
          <option value='title'>Title (A–Z)</option>
          <option value='lastUsed'>Last Used</option>
          <option value='duration'>Duration</option>
          <option value='dateCreated'>Date Created</option>
        </select>

        <div className='view-toggle' role='group' aria-label='View mode'>
          <button type="button"
            className={clsx('btn', 'btn-icon', { active: viewMode === 'grid' })}
            onClick={() => onViewModeChange('grid')}
            aria-label='Grid view'
            aria-pressed={viewMode === 'grid'}
          >
            <Icon name='grid' />
          </button>
          <button type="button"
            className={clsx('btn', 'btn-icon', { active: viewMode === 'list' })}
            onClick={() => onViewModeChange('list')}
            aria-label='List view'
            aria-pressed={viewMode === 'list'}
          >
            <Icon name='list' />
          </button>
        </div>
      </div>
    </div>
  )
}

TemplateToolbar.propTypes = {
  onNewTemplate: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  sortBy: PropTypes.string.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired
}

export default TemplateToolbar
