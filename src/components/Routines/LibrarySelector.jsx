/**
 * Library Selector Component
 * Embedded library component for selecting routine templates
 * Displays only routine templates and provides action buttons
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  getAllTemplates,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  filterTemplates,
  sortTemplates
} from '../../utils/templatesManager'
import { isIndexedDBAvailable } from '../../utils/indexedDBManager'
import {
  seedPredefinedTemplates,
  arePredefinedTemplatesSeeded
} from '../../utils/predefinedTemplates'
import {
  fixCorruptedTemplateTypes,
  needsTemplateMigration
} from '../../utils/templateMigration'
import TemplateCard from '../Library/TemplateCard'
import TemplateEditor from '../Library/TemplateEditor'
import Icon from '../common/Icon'
import { createLogger } from '../../utils/logger'
import { withErrorHandling } from '../../utils/errorHandler'

const logger = createLogger('LibrarySelector')

function LibrarySelector({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [useIndexedDB, setUseIndexedDB] = useState(false)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const toastTimeoutRef = useRef(null)

  // Toast notification helper - memoized to avoid recreating on every render
  const showToastNotification = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
    setToastMessage(message)
    setShowToast(true)
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = null
      }
    }
  }, [])

  // Load templates on mount
  useEffect(() => {
    let isCancelled = false

    const loadTemplates = async () => {
      if (!isIndexedDBAvailable()) {
        if (!isCancelled) {
          setLoading(false)
          setUseIndexedDB(false)
        }
        return
      }

      if (!isCancelled) {
        setUseIndexedDB(true)
      }

      await withErrorHandling(
        async () => {
          // Check if predefined templates need to be seeded
          const isSeeded = await arePredefinedTemplatesSeeded()
          if (!isSeeded && !isCancelled) {
            const seedResults = await seedPredefinedTemplates()
            if (seedResults.added > 0) {
              logger.log(`Seeded ${seedResults.added} predefined templates`)
            }
          }

          // Check for and fix corrupted template types
          const needsMigration = await needsTemplateMigration()
          if (needsMigration && !isCancelled) {
            logger.log('Detected corrupted template types, fixing...')
            const fixResults = await fixCorruptedTemplateTypes()
            if (fixResults.fixed > 0) {
              logger.log(`Fixed ${fixResults.fixed} templates`)
            }
          }

          // Load all templates
          const allTemplates = await getAllTemplates()
          if (!isCancelled) {
            logger.log(`Loaded ${allTemplates.length} total templates`)
            logger.log(
              `Template types: ${allTemplates.map((t) => t.type).join(', ')}`
            )
            setTemplates(allTemplates)
          }
        },
        'Loading templates',
        {
          showToast: false,
          onError: (error) => {
            logger.error('Failed to load templates:', error)
            if (!isCancelled) {
              showToastNotification('Failed to load templates')
            }
          }
        }
      )

      if (!isCancelled) {
        setLoading(false)
      }
    }

    loadTemplates()

    return () => {
      isCancelled = true
    }
  }, [showToastNotification])

  // Filter and sort templates - only show routine templates
  const filteredAndSortedTemplates = useMemo(() => {
    logger.log(`Filtering templates. Total templates: ${templates.length}`)

    // Only show routine templates
    const routineTemplates = templates.filter(
      (t) => t.type?.trim().toLowerCase() === 'routine'
    )
    logger.log(
      `Routine templates after type filter: ${routineTemplates.length}`
    )

    // Apply search filter using filterTemplates utility
    let filtered = filterTemplates(routineTemplates, {
      type: 'routine',
      tags: [],
      durationMin: null,
      durationMax: null
    })

    logger.log(`Templates after filterTemplates: ${filtered.length}`)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
      logger.log(`Templates after search filter: ${filtered.length}`)
    }

    // Sort templates
    return sortTemplates(filtered, sortBy)
  }, [templates, searchQuery, sortBy])

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleSaveTemplate = async (templateData) => {
    await withErrorHandling(
      async () => {
        if (editingTemplate) {
          // Update existing template
          await updateTemplate(editingTemplate.id, templateData)
          showToastNotification('Template updated successfully')
        } else {
          // Create new template - ensure it's a routine type
          await saveTemplate({ ...templateData, type: 'routine' })
          showToastNotification('Template created successfully')
        }

        // Reload templates
        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)
        setShowEditor(false)
        setEditingTemplate(null)
      },
      'Saving template',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to save template')
      }
    )
  }

  const handleDeleteTemplate = async (template) => {
    await withErrorHandling(
      async () => {
        if (!template || !template.id) {
          throw new Error('Cannot delete template without a valid id')
        }
        await deleteTemplate(template.id)
        showToastNotification('Template deleted')

        // Reload templates
        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)
      },
      'Deleting template',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to delete template')
      }
    )
  }

  const handleDuplicateTemplate = async (template) => {
    await withErrorHandling(
      async () => {
        // Create a copy with a new ID and modified title
        const duplicatedTemplate = {
          ...template,
          id: undefined, // Let saveTemplate generate a new ID
          title: `${template.title} (Copy)`,
          createdAt: new Date().toISOString(),
          lastUsed: null
        }
        await saveTemplate(duplicatedTemplate)
        showToastNotification('Template duplicated')

        // Reload templates
        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)
      },
      'Duplicating template',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to duplicate template')
      }
    )
  }

  const handleUseTemplate = (template) => {
    onSelectTemplate(template)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Icon name='loader' className='icon-spin' />
        <p className='small'>Loading templates...</p>
      </div>
    )
  }

  if (!useIndexedDB) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p className='small'>
          IndexedDB is not available. Templates cannot be loaded.
        </p>
      </div>
    )
  }

  return (
    <div className='library-selector'>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}
      >
        <input
          type='text'
          placeholder='Search routines...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
          aria-label='Search routine templates'
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label='Sort templates by'
        >
          <option value='title'>Title</option>
          <option value='recentlyUsed'>Recently Used</option>
          <option value='recentlyCreated'>Recently Created</option>
        </select>

        <button
          className='btn btn-primary'
          onClick={handleNewTemplate}
          aria-label='Create new routine template'
        >
          <Icon name='plus' />
          New Template
        </button>
      </div>

      {/* Template List */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            opacity: 0.7
          }}
        >
          <p className='small'>
            {searchQuery
              ? 'No routines match your search'
              : 'No routine templates yet'}
          </p>
          <button
            className='btn btn-primary'
            onClick={handleNewTemplate}
            style={{ marginTop: '12px' }}
          >
            <Icon name='plus' />
            Create First Template
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '12px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {filteredAndSortedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode='list'
              onUse={handleUseTemplate}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              onDuplicate={handleDuplicateTemplate}
              showDelete={false}
            />
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          typeFilter='routine'
        />
      )}

      {/* Toast notification */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--glass-hi)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 1000
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}

LibrarySelector.propTypes = {
  onSelectTemplate: PropTypes.func.isRequired
}

export default LibrarySelector
