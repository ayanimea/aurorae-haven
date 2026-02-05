import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CalendarSubscriptionModal from '../components/Schedule/CalendarSubscriptionModal'
import * as calendarManager from '../utils/calendarSubscriptionManager'

// Mock Icon component
jest.mock('../components/common/Icon', () => {
  return function Icon({ name }) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
})

// Mock Modal component
jest.mock('../components/common/Modal', () => {
  return function Modal({ isOpen, children, title, onClose }) {
    if (!isOpen) return null
    return (
      <div data-testid='modal'>
        <h2>{title}</h2>
        <button onClick={onClose} data-testid='modal-close'>
          Close
        </button>
        {children}
      </div>
    )
  }
})

// Mock calendar subscription manager
jest.mock('../utils/calendarSubscriptionManager', () => ({
  getCalendarSubscriptions: jest.fn(),
  addCalendarSubscription: jest.fn(),
  deleteCalendarSubscription: jest.fn(),
  updateCalendarSubscription: jest.fn(),
  syncCalendar: jest.fn()
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn()
  })
}))

describe('CalendarSubscriptionModal Integration Tests', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Don't set default here - let each test set its own mock data
  })

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      calendarManager.getCalendarSubscriptions.mockResolvedValue([])
      render(<CalendarSubscriptionModal isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', async () => {
      calendarManager.getCalendarSubscriptions.mockResolvedValue([])
      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument()
        expect(
          screen.getByText('Manage Calendar Subscriptions')
        ).toBeInTheDocument()
      })
    })

    it('should display add calendar button when no form is shown', async () => {
      calendarManager.getCalendarSubscriptions.mockResolvedValue([])
      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      // Wait for loading to finish
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      expect(
        screen.getByRole('button', { name: /add new calendar subscription/i })
      ).toBeInTheDocument()
    })
  })

  describe('Loading Subscriptions', () => {
    it('should load and display subscriptions on mount', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          name: 'Work Calendar',
          url: 'https://example.com/work.ics',
          color: '#86f5e0',
          enabled: true,
          lastSyncedAt: '2025-01-19T10:00:00Z'
        },
        {
          id: 'sub-2',
          name: 'Personal Calendar',
          url: 'https://example.com/personal.ics',
          color: '#ff6b6b',
          enabled: false
        }
      ]

      calendarManager.getCalendarSubscriptions.mockResolvedValue(
        mockSubscriptions
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
        expect(screen.getByText('Personal Calendar')).toBeInTheDocument()
      })
    })

    it('should display error message when loading fails', async () => {
      calendarManager.getCalendarSubscriptions.mockRejectedValue(
        new Error('Network error')
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load calendar subscriptions/i)
        ).toBeInTheDocument()
      })
    })

    it('should display loading indicator while fetching subscriptions', async () => {
      calendarManager.getCalendarSubscriptions.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/loading subscriptions/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Adding Subscriptions', () => {
    beforeEach(() => {
      calendarManager.addCalendarSubscription.mockResolvedValue('new-sub-id')
      calendarManager.getCalendarSubscriptions.mockResolvedValue([])
    })

    it('should show add form when add calendar button is clicked', async () => {
      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      // Wait for loading to finish
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', {
        name: /add new calendar subscription/i
      })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/calendar name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/ics url/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields before submission', async () => {
      const { container } = render(
        <CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />
      )

      // Wait for loading to finish and click add button
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      fireEvent.click(
        screen.getByRole('button', { name: /add new calendar subscription/i })
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/calendar name/i)).toBeInTheDocument()
      })

      // Submit the form
      const form = container.querySelector('form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(
          screen.getByText(/Name and URL are required/i)
        ).toBeInTheDocument()
      })

      expect(calendarManager.addCalendarSubscription).not.toHaveBeenCalled()
    })

    it('should successfully add a new subscription with valid data', async () => {
      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      // Wait for loading to finish
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      fireEvent.click(
        screen.getByRole('button', { name: /add new calendar subscription/i })
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/calendar name/i)).toBeInTheDocument()
      })

      // Fill in the form
      const nameInput = screen.getByLabelText(/calendar name/i)
      const urlInput = screen.getByLabelText(/ics url/i)

      fireEvent.change(nameInput, { target: { value: 'Test Calendar' } })
      fireEvent.change(urlInput, {
        target: { value: 'https://example.com/test.ics' }
      })

      // Submit the form
      const submitButton = screen.getByRole('button', {
        name: /add calendar$/i
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(calendarManager.addCalendarSubscription).toHaveBeenCalledWith({
          name: 'Test Calendar',
          url: 'https://example.com/test.ics',
          color: '#86f5e0',
          enabled: true
        })
      })
    })

    it('should display error message when adding subscription fails', async () => {
      calendarManager.addCalendarSubscription.mockRejectedValue(
        new Error('Invalid URL')
      )

      const { container } = render(
        <CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />
      )

      // Wait for loading to finish
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      fireEvent.click(
        screen.getByRole('button', { name: /add new calendar subscription/i })
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/calendar name/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/calendar name/i)
      const urlInput = screen.getByLabelText(/ics url/i)

      fireEvent.change(nameInput, { target: { value: 'Test' } })
      fireEvent.change(urlInput, {
        target: { value: 'https://example.com/invalid.ics' }
      })

      // Submit the form
      const form = container.querySelector('form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to add calendar subscription/i)
        ).toBeInTheDocument()
      })
    })

    it('should hide add form and reload subscriptions after successful add', async () => {
      const newSubscription = {
        id: 'new-sub',
        name: 'New Calendar',
        url: 'https://example.com/new.ics',
        enabled: true
      }

      calendarManager.addCalendarSubscription.mockResolvedValue('new-sub')
      calendarManager.getCalendarSubscriptions
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([newSubscription])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      // Wait for loading to finish
      await waitFor(() => {
        expect(
          screen.queryByText(/loading subscriptions/i)
        ).not.toBeInTheDocument()
      })

      fireEvent.click(
        screen.getByRole('button', { name: /add new calendar subscription/i })
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/calendar name/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/calendar name/i), {
        target: { value: 'New Calendar' }
      })
      fireEvent.change(screen.getByLabelText(/ics url/i), {
        target: { value: 'https://example.com/new.ics' }
      })

      fireEvent.click(screen.getByRole('button', { name: /add calendar$/i }))

      await waitFor(() => {
        expect(screen.getByText('New Calendar')).toBeInTheDocument()
        expect(
          screen.queryByLabelText(/calendar name/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Deleting Subscriptions', () => {
    beforeEach(() => {
      calendarManager.deleteCalendarSubscription.mockResolvedValue()
    })

    it('should prompt for confirmation before deleting', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          name: 'Work Calendar',
          url: 'https://example.com/work.ics',
          color: '#86f5e0',
          enabled: true
        }
      ]

      calendarManager.getCalendarSubscriptions.mockResolvedValue(
        mockSubscriptions
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(
        /delete calendar subscription/i
      )
      fireEvent.click(deleteButton)

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText('Delete Calendar Subscription')
        ).toBeInTheDocument()
        expect(
          screen.getByText(/Are you sure you want to delete "Work Calendar"/)
        ).toBeInTheDocument()
      })

      // Click Cancel button
      const cancelButton = screen.getByLabelText('Cancel')
      fireEvent.click(cancelButton)

      // Delete should not be called
      expect(calendarManager.deleteCalendarSubscription).not.toHaveBeenCalled()
    })

    it('should delete subscription when confirmed', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          name: 'Work Calendar',
          url: 'https://example.com/work.ics',
          enabled: true
        }
      ]

      calendarManager.getCalendarSubscriptions
        .mockResolvedValueOnce(mockSubscriptions)
        .mockResolvedValueOnce([])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(
        /delete calendar subscription/i
      )
      fireEvent.click(deleteButton)

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText('Delete Calendar Subscription')
        ).toBeInTheDocument()
      })

      // Click Delete button in confirmation dialog
      const confirmDeleteButton = screen.getByLabelText('Delete')
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
        expect(calendarManager.deleteCalendarSubscription).toHaveBeenCalledWith(
          'sub-1'
        )
      })
    })

    it('should display error when deletion fails', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          name: 'Work Calendar',
          url: 'https://example.com/work.ics',
          color: '#86f5e0',
          enabled: true
        }
      ]

      calendarManager.getCalendarSubscriptions.mockResolvedValue(
        mockSubscriptions
      )
      calendarManager.deleteCalendarSubscription.mockRejectedValue(
        new Error('Database error')
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(
        /delete calendar subscription/i
      )
      fireEvent.click(deleteButton)

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText('Delete Calendar Subscription')
        ).toBeInTheDocument()
      })

      // Click Delete button in confirmation dialog
      const confirmDeleteButton = screen.getByLabelText('Delete')
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to delete calendar subscription/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Toggling Subscription Status', () => {
    it('should toggle subscription enabled state', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true
      }

      calendarManager.getCalendarSubscriptions
        .mockResolvedValueOnce([mockSubscription])
        .mockResolvedValueOnce([{ ...mockSubscription, enabled: false }])

      calendarManager.updateCalendarSubscription.mockResolvedValue()

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const toggleButton = screen.getByLabelText(/disable calendar/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(calendarManager.updateCalendarSubscription).toHaveBeenCalledWith(
          {
            id: 'sub-1',
            name: 'Work Calendar',
            url: 'https://example.com/work.ics',
            enabled: false
          }
        )
      })
    })

    it('should display error when toggle fails', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true
      }

      calendarManager.getCalendarSubscriptions.mockResolvedValue([
        mockSubscription
      ])
      calendarManager.updateCalendarSubscription.mockRejectedValue(
        new Error('Update failed')
      )

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const toggleButton = screen.getByLabelText(/disable calendar/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(
          screen.getByText(/failed to update calendar subscription/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Syncing Calendar', () => {
    it('should trigger manual sync when sync button is clicked', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true
      }

      calendarManager.getCalendarSubscriptions
        .mockResolvedValueOnce([mockSubscription])
        .mockResolvedValueOnce([mockSubscription])
      calendarManager.syncCalendar.mockResolvedValue()

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const syncButton = screen.getByLabelText(/sync calendar now/i)
      fireEvent.click(syncButton)

      await waitFor(() => {
        expect(calendarManager.syncCalendar).toHaveBeenCalledWith('sub-1')
      })
    })

    it('should display error when sync fails', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true
      }

      calendarManager.getCalendarSubscriptions.mockResolvedValue([
        mockSubscription
      ])
      calendarManager.syncCalendar.mockRejectedValue(new Error('Network error'))

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Work Calendar')).toBeInTheDocument()
      })

      const syncButton = screen.getByLabelText(/sync calendar now/i)
      fireEvent.click(syncButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to sync calendar/i)).toBeInTheDocument()
      })
    })
  })

  describe('Subscription Status Display', () => {
    it('should display enabled status correctly', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true
      }

      calendarManager.getCalendarSubscriptions.mockResolvedValue([
        mockSubscription
      ])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status: enabled/i)).toBeInTheDocument()
      })
    })

    it('should display last sync time when available', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true,
        lastSyncedAt: '2025-01-19T10:30:00Z'
      }

      calendarManager.getCalendarSubscriptions.mockResolvedValue([
        mockSubscription
      ])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(/last synced:/i)).toBeInTheDocument()
      })
    })

    it('should display sync error when present', async () => {
      const mockSubscription = {
        id: 'sub-1',
        name: 'Work Calendar',
        url: 'https://example.com/work.ics',
        enabled: true,
        syncStatus: 'error',
        lastSyncError: 'Invalid URL format'
      }

      calendarManager.getCalendarSubscriptions.mockResolvedValue([
        mockSubscription
      ])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(
          screen.getByText(/error: invalid url format/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state message when no subscriptions exist', async () => {
      calendarManager.getCalendarSubscriptions.mockResolvedValue([])

      render(<CalendarSubscriptionModal isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(
          screen.getByText(/no calendar subscriptions yet/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/add a calendar to sync external events/i)
        ).toBeInTheDocument()
      })
    })
  })
})
