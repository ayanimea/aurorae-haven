/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('renders with empty form initially', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText('Routine Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Add Step')).toBeInTheDocument()
    expect(screen.getByText('Create Routine')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders with one default empty step', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    const stepInputs = screen.getAllByPlaceholderText('Step name...')
    expect(stepInputs).toHaveLength(1)
  })

  it('populates form when editing existing routine', () => {
    const routine = {
      id: 'routine-1',
      name: 'Morning Routine',
      tags: ['morning', 'daily'],
      steps: [
        { label: 'Wake up', duration: 300, description: 'Gently wake up' },
        { label: 'Stretch', duration: 600, description: 'Full body stretch' }
      ]
    }

    render(
      <RoutineEditor
        routine={routine}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('Morning Routine')).toBeInTheDocument()
    expect(screen.getByDisplayValue('morning, daily')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Wake up')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Stretch')).toBeInTheDocument()
    expect(screen.getByText('Save Routine')).toBeInTheDocument()
  })

  it('adds a new step when Add Step button is clicked', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    let stepInputs = screen.getAllByPlaceholderText('Step name...')
    expect(stepInputs).toHaveLength(1)

    fireEvent.click(screen.getByText('Add Step'))

    stepInputs = screen.getAllByPlaceholderText('Step name...')
    expect(stepInputs).toHaveLength(2)
  })

  it('validates that name is required', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    const submitButton = screen.getByText('Create Routine')
    expect(submitButton).toBeDisabled()
  })

  it('calls onSave with correct data when form is submitted', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('Routine Name')
    fireEvent.change(nameInput, { target: { value: 'Test Routine' } })

    const stepInput = screen.getByPlaceholderText('Step name...')
    fireEvent.change(stepInput, { target: { value: 'Step 1' } })

    const submitButton = screen.getByText('Create Routine')
    expect(submitButton).not.toBeDisabled()

    fireEvent.click(submitButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Routine',
        title: 'Test Routine',
        tags: [],
        steps: expect.arrayContaining([
          expect.objectContaining({
            label: 'Step 1',
            duration: 300
          })
        ]),
        estimatedDuration: 300
      })
    )
  })

  it('calls onCancel when Cancel button is clicked', () => {
    render(<RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('computes estimatedDuration from valid steps only', () => {
    const { container } = render(
      <RoutineEditor onSave={mockOnSave} onCancel={mockOnCancel} />
    )

    const nameInput = screen.getByLabelText('Routine Name')
    fireEvent.change(nameInput, { target: { value: 'Test' } })

    const stepInput = screen.getByPlaceholderText('Step name...')
    fireEvent.change(stepInput, { target: { value: 'Step 1' } })

    // Submit the form
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // Should count duration from the valid step (300 seconds)
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        estimatedDuration: 300,
        steps: [expect.objectContaining({ label: 'Step 1', duration: 300 })]
      })
    )
  })
})
