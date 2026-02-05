import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import ConfirmDialog from '../common/ConfirmDialog'
import {
  getCalendarSubscriptions,
  addCalendarSubscription,
  deleteCalendarSubscription,
  updateCalendarSubscription,
  syncCalendar
} from '../../utils/calendarSubscriptionManager'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CalendarSubscriptionModal')

/**
 * Modal for managing external calendar subscriptions
 */
function CalendarSubscriptionModal({ isOpen, onClose }) {
  const [subscriptions, setSubscriptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // {id, name} when showing confirm dialog
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    color: '#86f5e0',
    enabled: true
  })

  // Load subscriptions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSubscriptions()
    }
  }, [isOpen])

  const loadSubscriptions = async () => {
    setIsLoading(true)
    setError('')
    try {
      const subs = await getCalendarSubscriptions()
      setSubscriptions(subs)
    } catch (err) {
      logger.error('Failed to load subscriptions:', err)
      setError('Failed to load calendar subscriptions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSubscription = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Name and URL are required')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await addCalendarSubscription(formData)
      setFormData({
        name: '',
        url: '',
        color: '#86f5e0',
        enabled: true
      })
      setShowAddForm(false)
      await loadSubscriptions()
      logger.log('Calendar subscription added successfully')
    } catch (err) {
      logger.error('Failed to add subscription:', err)
      setError(
        'Failed to add calendar subscription. Please check the URL and try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubscription = async (id, name) => {
    // Show confirmation dialog
    setConfirmDelete({ id, name })
  }

  const confirmDeleteSubscription = async () => {
    if (!confirmDelete) return

    setIsLoading(true)
    setError('')
    try {
      await deleteCalendarSubscription(confirmDelete.id)
      await loadSubscriptions()
      logger.log('Calendar subscription deleted')
    } catch (err) {
      logger.error('Failed to delete subscription:', err)
      setError('Failed to delete calendar subscription')
    } finally {
      setIsLoading(false)
      setConfirmDelete(null)
    }
  }

  const handleToggleSubscription = async (subscription) => {
    setIsLoading(true)
    setError('')
    try {
      await updateCalendarSubscription({
        ...subscription,
        enabled: !subscription.enabled
      })
      await loadSubscriptions()
      logger.log(
        `Calendar subscription ${subscription.enabled ? 'disabled' : 'enabled'}`
      )
    } catch (err) {
      logger.error('Failed to toggle subscription:', err)
      setError('Failed to update calendar subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncSubscription = async (id) => {
    setIsLoading(true)
    setError('')
    try {
      await syncCalendar(id)
      await loadSubscriptions()
      logger.log('Calendar synced successfully')
    } catch (err) {
      logger.error('Failed to sync calendar:', err)
      setError('Failed to sync calendar. Please check the URL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Manage Calendar Subscriptions'
    >
      <div className='calendar-subscriptions'>
        {error && (
          <div className='error-message' role='alert' aria-live='assertive'>
            <Icon name='alertCircle' />
            <span>{error}</span>
          </div>
        )}

        {!showAddForm && (
          <div className='calendar-subscriptions-header'>
            <button
              type='button'
              className='btn btn-primary'
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
              aria-label='Add new calendar subscription'
            >
              <Icon name='plus' />
              Add Calendar
            </button>
          </div>
        )}

        {showAddForm && (
          <form
            onSubmit={handleAddSubscription}
            className='calendar-subscription-form'
          >
            <div className='form-group'>
              <label htmlFor='calendar-name'>
                Calendar Name <span className='required'>*</span>
              </label>
              <input
                id='calendar-name'
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g., Work Calendar'
                disabled={isLoading}
                required
                aria-required='true'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='calendar-url'>
                ICS URL <span className='required'>*</span>
              </label>
              <input
                id='calendar-url'
                type='url'
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder='https://example.com/calendar.ics'
                disabled={isLoading}
                required
                aria-required='true'
              />
              <small className='form-help'>
                The URL to your calendar&apos;s ICS feed
              </small>
            </div>

            <div className='form-group'>
              <label htmlFor='calendar-color'>Color</label>
              <input
                id='calendar-color'
                type='color'
                value={formData.color}
                onChange={(e) => {
                  const colorValue = e.target.value
                  // Validate hex color format (#RRGGBB)
                  if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                    setFormData({ ...formData, color: colorValue })
                  }
                }}
                disabled={isLoading}
              />
            </div>

            <div className='form-actions'>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({
                    name: '',
                    url: '',
                    color: '#86f5e0',
                    enabled: true
                  })
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={isLoading}
              >
                <Icon name='check' />
                Add Calendar
              </button>
            </div>
          </form>
        )}

        {isLoading && subscriptions.length === 0 && (
          <div className='loading-indicator' role='status' aria-live='polite'>
            <Icon name='loader' />
            <span>Loading subscriptions...</span>
          </div>
        )}

        {!showAddForm && subscriptions.length === 0 && !isLoading && (
          <div className='calendar-subscriptions-empty'>
            <Icon name='inbox' />
            <p>No calendar subscriptions yet</p>
            <p className='small'>Add a calendar to sync external events</p>
          </div>
        )}

        {!showAddForm && subscriptions.length > 0 && (
          <div className='calendar-subscriptions-list'>
            {subscriptions.map((sub) => (
              <div key={sub.id} className='calendar-subscription-item'>
                <div className='calendar-subscription-info'>
                  <div className='calendar-subscription-header'>
                    <div
                      className='calendar-subscription-color'
                      style={{ backgroundColor: sub.color }}
                      aria-label={`Color indicator for ${sub.name}`}
                    />
                    <h4 className='calendar-subscription-name'>{sub.name}</h4>
                    <span
                      className={`calendar-subscription-status ${sub.enabled ? 'enabled' : 'disabled'}`}
                      aria-label={`Status: ${sub.enabled ? 'Enabled' : 'Disabled'}`}
                    >
                      {sub.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className='calendar-subscription-url'>{sub.url}</div>
                  {sub.lastSyncedAt && (
                    <div className='calendar-subscription-meta'>
                      Last synced: {new Date(sub.lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                  {sub.syncStatus === 'error' && sub.lastSyncError && (
                    <div className='calendar-subscription-error'>
                      <Icon name='alertCircle' />
                      Error: {sub.lastSyncError}
                    </div>
                  )}
                </div>
                <div className='calendar-subscription-actions'>
                  <button
                    type='button'
                    className='btn btn-sm'
                    onClick={() => handleToggleSubscription(sub)}
                    disabled={isLoading}
                    aria-label={
                      sub.enabled ? 'Disable calendar' : 'Enable calendar'
                    }
                  >
                    <Icon name={sub.enabled ? 'eyeOff' : 'eye'} />
                  </button>
                  <button
                    type='button'
                    className='btn btn-sm'
                    onClick={() => handleSyncSubscription(sub.id)}
                    disabled={isLoading || !sub.enabled}
                    aria-label='Sync calendar now'
                  >
                    <Icon name='refreshCw' />
                  </button>
                  <button
                    type='button'
                    className='btn btn-sm btn-danger'
                    onClick={() => handleDeleteSubscription(sub.id, sub.name)}
                    disabled={isLoading}
                    aria-label='Delete calendar subscription'
                  >
                    <Icon name='trash' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title='Delete Calendar Subscription'
        message={
          confirmDelete
            ? `Are you sure you want to delete "${confirmDelete.name}"? This will remove all synced events from this calendar.`
            : ''
        }
        onConfirm={confirmDeleteSubscription}
        onCancel={() => setConfirmDelete(null)}
        confirmText='Delete'
        cancelText='Cancel'
        confirmDanger={true}
      />
    </Modal>
  )
}

CalendarSubscriptionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default CalendarSubscriptionModal
