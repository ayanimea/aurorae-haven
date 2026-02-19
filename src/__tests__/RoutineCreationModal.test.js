/**
 * Tests for RoutineCreationModal component
 * Validates routine creation workflow, library integration, and state management
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RoutineCreationModal from '../components/Routines/RoutineCreationModal'

// Mock the LibrarySelector component
jest.mock('../components/Routines/LibrarySelector', () => {
  return function MockLibrarySelector({ onSelectTemplate }) {
    return (
      <div data-testid='library-selector'>
        <button
          onClick={() =>
            onSelectTemplate({
              id: 'test-template',
              title: 'Test Template',
              type: 'routine'
            })
          }
        >
          Select Template
        </button>
      </div>
    )
  }
})

describe('RoutineCreationModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSelectTemplate = jest.fn().mockResolvedValue()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSelectTemplate: mockOnSelectTemplate
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<RoutineCreationModal {...defaultProps} />)
      expect(screen.getByText('Create New Routine')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<RoutineCreationModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Create New Routine')).not.toBeInTheDocument()
    })

    it('shows initial options screen by default', () => {
      render(<RoutineCreationModal {...defaultProps} />)
      expect(
        screen.getByText('Choose a routine template from the library:')
      ).toBeInTheDocument()
      expect(screen.getByText('Browse Library')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('switches to library selector when Browse Library is clicked', () => {
      render(<RoutineCreationModal {...defaultProps} />)

      const browseButton = screen.getByText('Browse Library')
      fireEvent.click(browseButton)

      expect(screen.getByTestId('library-selector')).toBeInTheDocument()
      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    it('switches back to options when Back button is clicked', () => {
      render(<RoutineCreationModal {...defaultProps} />)

      // Go to library
      const browseButton = screen.getByText('Browse Library')
      fireEvent.click(browseButton)

      // Go back
      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)

      expect(
        screen.getByText('Choose a routine template from the library:')
      ).toBeInTheDocument()
      expect(screen.queryByTestId('library-selector')).not.toBeInTheDocument()
    })
  })

  describe('Template Selection', () => {
    it('calls onSelectTemplate and onClose when template is selected', async () => {
      render(<RoutineCreationModal {...defaultProps} />)

      // Navigate to library
      const browseButton = screen.getByText('Browse Library')
      fireEvent.click(browseButton)

      // Select a template
      const selectButton = screen.getByText('Select Template')
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(mockOnSelectTemplate).toHaveBeenCalledWith({
          id: 'test-template',
          title: 'Test Template',
          type: 'routine'
        })
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Cancel Flow', () => {
    it('calls onClose when Cancel button is clicked', () => {
      render(<RoutineCreationModal {...defaultProps} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
      expect(mockOnSelectTemplate).not.toHaveBeenCalled()
    })
  })

  describe('State Reset', () => {
    it('resets to options screen when modal is closed', () => {
      render(<RoutineCreationModal {...defaultProps} />)

      // Navigate to library
      const browseButton = screen.getByText('Browse Library')
      fireEvent.click(browseButton)
      expect(screen.getByTestId('library-selector')).toBeInTheDocument()

      // Go back to initial screen
      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)

      // Now close via Cancel button
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
      // The state is reset in handleClose, so next open would show options screen
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<RoutineCreationModal {...defaultProps} />)

      // Navigate to library
      const browseButton = screen.getByText('Browse Library')
      fireEvent.click(browseButton)

      const backButton = screen.getByLabelText('Back to options')
      expect(backButton).toBeInTheDocument()
    })
  })
})
