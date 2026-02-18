/**
 * Library Page - TAB-LIB Implementation
 * Manages reusable Task and Routine templates
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  getAllTemplates,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  markTemplateUsed,
  filterTemplates,
  sortTemplates,
  exportTemplates,
  importTemplates
} from '../utils/templatesManager'
import { instantiateTemplate } from '../utils/templateInstantiation'
import { isIndexedDBAvailable } from '../utils/indexedDBManager'
import {
  seedPredefinedTemplates,
  arePredefinedTemplatesSeeded
} from '../utils/predefinedTemplates'
import TemplateCard from '../components/Library/TemplateCard'
import TemplateEditor from '../components/Library/TemplateEditor'
import TemplateToolbar from '../components/Library/TemplateToolbar'
import FilterModal from '../components/Library/FilterModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { createLogger } from '../utils/logger'
import { withErrorHandling } from '../utils/errorHandler'

const logger = createLogger('Library')

function Library() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [useIndexedDB, setUseIndexedDB] = useState(false)

  // UI state
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({
    type: null,
    tags: [],
    durationMin: null,
    durationMax: null
  })

  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState(null)

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!isIndexedDBAvailable()) {
        setLoading(false)
        setUseIndexedDB(false)
        return
      }

      setUseIndexedDB(true)

      await withErrorHandling(
        async () => {
          // Check if predefined templates need to be seeded
          const isSeeded = await arePredefinedTemplatesSeeded()
          if (!isSeeded) {
            const seedResults = await seedPredefinedTemplates()
            if (seedResults.added > 0) {
              logger.log(`Seeded ${seedResults.added} predefined templates`)
            }
          }

          // Load all templates
          const allTemplates = await getAllTemplates()
          setTemplates(allTemplates)
        },
        'Loading templates',
        {
          toastMessage: 'Failed to load templates'
        }
      )

      setLoading(false)
    }

    loadTemplates()
  }, [])

  // Filter and sort templates using useMemo
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) {
      return []
    }

    let result = templates

    // Apply search query
    if (searchQuery) {
      result = filterTemplates(result, { query: searchQuery })
    }

    // Apply filters
    result = filterTemplates(result, filters)

    // Apply sorting
    result = sortTemplates(result, sortBy)

    return result
  }, [templates, searchQuery, sortBy, filters])

  const showToastNotification = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleSaveTemplate = async (templateData) => {
    const successMessage = editingTemplate
      ? 'Template updated'
      : 'Template created'

    await withErrorHandling(
      async () => {
        if (editingTemplate) {
          await updateTemplate(editingTemplate.id, templateData)
        } else {
          await saveTemplate(templateData)
        }

        // Reload templates
        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)
        setShowEditor(false)
        setEditingTemplate(null)
        showToastNotification(successMessage)
      },
      'Saving template',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to save template')
      }
    )
  }

  const handleDeleteTemplate = async (templateId) => {
    const template = templates.find((t) => t.id === templateId)
    setTemplateToDelete(template)
    setShowDeleteConfirm(true)
  }

  // Confirmed delete action
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return

    await withErrorHandling(
      async () => {
        await deleteTemplate(templateToDelete.id)
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

    // Close modal and reset state
    setShowDeleteConfirm(false)
    setTemplateToDelete(null)
  }

  // Cancel delete action
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setTemplateToDelete(null)
  }

  const handleDuplicateTemplate = async (templateId) => {
    await withErrorHandling(
      async () => {
        await duplicateTemplate(templateId)
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

  const handleUseTemplate = async (template) => {
    // Normalize template type to handle edge cases (whitespace, casing)
    const normalizedType =
      typeof template.type === 'string'
        ? template.type.trim().toLowerCase()
        : ''
    const isTaskTemplate = normalizedType === 'task'

    const successMessage = isTaskTemplate
      ? 'Template applied — Task created'
      : 'Template applied — Routine created'

    // Summary log for template usage
    logger.log('Using template:', {
      id: template.id,
      title: template.title,
      type: template.type,
      normalizedType,
      action: successMessage
    })

    await withErrorHandling(
      async () => {
        // TAB-LIB-13: Spawn a new Task or Routine pre-filled with template's fields
        await instantiateTemplate(template)

        // Mark template as used
        await markTemplateUsed(template.id)

        // Show appropriate confirmation message (TAB-LIB-15)
        showToastNotification(successMessage)
      },
      'Using template',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to use template')
      }
    )
  }

  const handleExport = async () => {
    await withErrorHandling(
      async () => {
        const data = await exportTemplates()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `templates-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        showToastNotification('Templates exported')
      },
      'Exporting templates',
      {
        showToast: false,
        onError: () => showToastNotification('Failed to export templates')
      }
    )
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    await withErrorHandling(
      async () => {
        const text = await file.text()
        const data = JSON.parse(text)
        const results = await importTemplates(data)

        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)

        showToastNotification(
          `Imported ${results.imported} templates (${results.skipped} skipped)`
        )
      },
      'Importing templates',
      {
        showToast: false,
        onError: () => showToastNotification('Import failed: Invalid schema')
      }
    )
  }

  if (loading) {
    return (
      <div className='card'>
        <div className='card-h'>
          <strong>Library</strong>
          <span className='small'>Loading templates...</span>
        </div>
        <div className='card-b'>
          <p>Loading your template library...</p>
        </div>
      </div>
    )
  }

  if (!useIndexedDB) {
    return (
      <div className='card'>
        <div className='card-h'>
          <strong>Library</strong>
          <span className='small'>Template management</span>
        </div>
        <div className='card-b'>
          <p>
            Template library requires IndexedDB support. Your browser may not
            support this feature, or it may be disabled.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='library-container'>
      {/* TAB-LIB-03: Toolbar with actions */}
      <TemplateToolbar
        onNewTemplate={handleNewTemplate}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={setSearchQuery}
        onFilter={() => setShowFilterModal(true)}
        onSort={setSortBy}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        sortBy={sortBy}
        viewMode={viewMode}
      />

      {/* TAB-LIB-01: Template grid/list with separated sections */}
      {filteredTemplates.length === 0 ? (
        <div className='empty-state'>
          <p>No templates found.</p>
          <p className='small'>Create your first template to get started!</p>
        </div>
      ) : (
        <>
          {/* Routine Templates Section */}
          {(() => {
            const routineTemplates = filteredTemplates.filter(
              (t) => t.type === 'routine'
            )
            const routineCount = routineTemplates.length
            return (
              routineCount > 0 && (
                <div className='template-section'>
                  <div className='template-section-header'>
                    <h2>Routines</h2>
                    <span className='small'>
                      {routineCount}{' '}
                      {routineCount === 1 ? 'routine' : 'routines'}
                    </span>
                  </div>
                  <div
                    className={`template-${viewMode}`}
                    role={viewMode === 'grid' ? 'grid' : 'list'}
                  >
                    {routineTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        viewMode={viewMode}
                        onUse={() => handleUseTemplate(template)}
                        onEdit={() => handleEditTemplate(template)}
                        onDelete={() => handleDeleteTemplate(template.id)}
                        onDuplicate={() => handleDuplicateTemplate(template.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          })()}

          {/* Task Templates Section */}
          {(() => {
            const taskTemplates = filteredTemplates.filter(
              (t) => t.type === 'task'
            )
            const taskCount = taskTemplates.length
            return (
              taskCount > 0 && (
                <div className='template-section'>
                  <div className='template-section-header'>
                    <h2>Tasks</h2>
                    <span className='small'>
                      {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div
                    className={`template-${viewMode}`}
                    role={viewMode === 'grid' ? 'grid' : 'list'}
                  >
                    {taskTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        viewMode={viewMode}
                        onUse={() => handleUseTemplate(template)}
                        onEdit={() => handleEditTemplate(template)}
                        onDelete={() => handleDeleteTemplate(template.id)}
                        onDuplicate={() => handleDuplicateTemplate(template.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          })()}
        </>
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
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className='toast' style={{ display: 'block' }}>
          {toastMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title='Delete Template'
        message={`Are you sure you want to delete the template "${templateToDelete?.title || 'this template'}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive
      />
    </div>
  )
}

export default Library
