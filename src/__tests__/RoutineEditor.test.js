/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import RoutineEditor from '../components/Routines/RoutineEditor'

// Mock Icon component
jest.mock('../components/common/Icon', () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}))

describe('RoutineEditor', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with empty form initially', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('Routine Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument()
      expect(screen.getByText('Steps')).toBeInTheDocument()
      expect(screen.getByText('Add Step')).toBeInTheDocument()
      expect(screen.getByText('Save Routine')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders with one default empty step', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(1)
    })

    it('populates form when editing existing routine', () => {
      const routine = {
        id: 'routine-1',
        name: 'Morning Routine',
        tags: ['morning', 'daily'],
        steps: [
          { label: 'Wake up', duration: 300, description: 'Gently wake up' },
          { label: 'Stretch', duration: 600 }
        ],
        estimatedDuration: 900
      }

      render(
        <RoutineEditor
          routine={routine}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText('Routine Name')).toHaveValue('Morning Routine')
      expect(screen.getByLabelText('Tags (comma-separated)')).toHaveValue(
        'morning, daily'
      )

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(2)
      expect(stepLabels[0]).toHaveValue('Wake up')
      expect(stepLabels[1]).toHaveValue('Stretch')
    })
  })

  describe('Validation', () => {
    it('does not save when name is blank', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    it('does not save when all steps have blank labels', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('Routine Name')
      fireEvent.change(nameInput, { target: { value: 'Test Routine' } })

      // Leave step label blank
      const stepLabel = screen.getByLabelText(/Step \d+ Label/)
      fireEvent.change(stepLabel, { target: { value: '   ' } })

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    it('filters out steps with blank labels when saving', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('Routine Name')
      fireEvent.change(nameInput, { target: { value: 'Test Routine' } })

      // Add second step
      const addStepButton = screen.getByText('Add Step')
      fireEvent.click(addStepButton)

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      
      // First step has label
      fireEvent.change(stepLabels[0], { target: { value: 'Valid Step' } })
      
      // Second step is blank
      fireEvent.change(stepLabels[1], { target: { value: '   ' } })

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
        const savedData = mockOnSave.mock.calls[0][0]
        expect(savedData.steps).toHaveLength(1)
        expect(savedData.steps[0].label).toBe('Valid Step')
      })
    })
  })

  describe('Duration Calculation', () => {
    it('computes estimatedDuration from valid steps only', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('Routine Name')
      fireEvent.change(nameInput, { target: { value: 'Test Routine' } })

      // Add second step
      const addStepButton = screen.getByText('Add Step')
      fireEvent.click(addStepButton)

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      const stepDurations = screen.getAllByLabelText(/Duration \(sec\)/)

      // First step: valid (300s)
      fireEvent.change(stepLabels[0], { target: { value: 'Step 1' } })
      fireEvent.change(stepDurations[0], { target: { value: '300' } })

      // Second step: blank label but has duration (600s) - should be filtered out
      fireEvent.change(stepLabels[1], { target: { value: '   ' } })
      fireEvent.change(stepDurations[1], { target: { value: '600' } })

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
        const savedData = mockOnSave.mock.calls[0][0]
        
        // Should only have 1 valid step
        expect(savedData.steps).toHaveLength(1)
        
        // estimatedDuration should be 300 (only valid step), not 900 (all steps)
        expect(savedData.estimatedDuration).toBe(300)
      })
    })

    it('displays total duration in UI for all steps', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      // Add step with 125 seconds (2 min 5 sec)
      const stepDuration = screen.getByLabelText(/Duration \(sec\)/)
      fireEvent.change(stepDuration, { target: { value: '125' } })

      // Check display shows 2 min 5 sec
      expect(screen.getByText(/Total duration: 2 min 5 sec/)).toBeInTheDocument()
    })

    it('updates display duration when steps are added', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      // First step: 300 seconds
      const stepDuration = screen.getByLabelText(/Duration \(sec\)/)
      fireEvent.change(stepDuration, { target: { value: '300' } })

      expect(screen.getByText(/Total duration: 5 min 0 sec/)).toBeInTheDocument()

      // Add second step: 240 seconds
      const addStepButton = screen.getByText('Add Step')
      fireEvent.click(addStepButton)

      const stepDurations = screen.getAllByLabelText(/Duration \(sec\)/)
      fireEvent.change(stepDurations[1], { target: { value: '240' } })

      // Total should be 540 seconds = 9 min 0 sec
      expect(screen.getByText(/Total duration: 9 min 0 sec/)).toBeInTheDocument()
    })
  })

  describe('Step Management', () => {
    it('adds new step when Add Step button clicked', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const addStepButton = screen.getByText('Add Step')
      fireEvent.click(addStepButton)

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(2)
    })

    it('removes step when Remove button clicked', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      // Add a second step
      const addStepButton = screen.getByText('Add Step')
      fireEvent.click(addStepButton)

      let stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(2)

      // Remove first step
      const removeButtons = screen.getAllByLabelText(/Remove step \d+/)
      fireEvent.click(removeButtons[0])

      stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(1)
    })

    it('cannot remove last remaining step', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const stepLabels = screen.getAllByLabelText(/Step \d+ Label/)
      expect(stepLabels).toHaveLength(1)

      // Remove button should not exist when only 1 step
      const removeButtons = screen.queryAllByLabelText(/Remove step \d+/)
      expect(removeButtons).toHaveLength(0)
    })
  })

  describe('Save Behavior', () => {
    it('calls onSave with correct routine data structure', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('Routine Name')
      fireEvent.change(nameInput, { target: { value: 'Test Routine' } })

      const tagsInput = screen.getByLabelText('Tags (comma-separated)')
      fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, tag3' } })

      const stepLabel = screen.getByLabelText(/Step \d+ Label/)
      fireEvent.change(stepLabel, { target: { value: 'Test Step' } })

      const stepDuration = screen.getByLabelText(/Duration \(sec\)/)
      fireEvent.change(stepDuration, { target: { value: '180' } })

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
        const savedData = mockOnSave.mock.calls[0][0]

        expect(savedData).toEqual({
          name: 'Test Routine',
          title: 'Test Routine',
          tags: ['tag1', 'tag2', 'tag3'],
          steps: [
            {
              label: 'Test Step',
              duration: 180,
              description: ''
            }
          ],
          estimatedDuration: 180
        })
      })
    })

    it('includes routine id when editing existing routine', async () => {
      const routine = {
        id: 'existing-routine-id',
        name: 'Existing Routine',
        tags: [],
        steps: [{ label: 'Step 1', duration: 60 }]
      }

      render(
        <RoutineEditor
          routine={routine}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
        const savedData = mockOnSave.mock.calls[0][0]
        expect(savedData.id).toBe('existing-routine-id')
      })
    })

    it('trims whitespace from name and tags', async () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('Routine Name')
      fireEvent.change(nameInput, { target: { value: '  Trimmed Name  ' } })

      const tagsInput = screen.getByLabelText('Tags (comma-separated)')
      fireEvent.change(tagsInput, {
        target: { value: '  tag1  ,  tag2  ,   ' }
      })

      const stepLabel = screen.getByLabelText(/Step \d+ Label/)
      fireEvent.change(stepLabel, { target: { value: 'Step' } })

      const saveButton = screen.getByText('Save Routine')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
        const savedData = mockOnSave.mock.calls[0][0]
        expect(savedData.name).toBe('Trimmed Name')
        expect(savedData.tags).toEqual(['tag1', 'tag2'])
      })
    })
  })

  describe('Cancel Behavior', () => {
    it('calls onCancel when Cancel button clicked', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all form fields', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('Routine Name')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Tags (comma-separated)')
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/Step \d+ Label/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Duration \(sec\)/)).toBeInTheDocument()
    })

    it('buttons are not disabled by default', () => {
      render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByText('Save Routine')).not.toBeDisabled()
      expect(screen.getByText('Cancel')).not.toBeDisabled()
      expect(screen.getByText('Add Step')).not.toBeDisabled()
    })
  })
})
