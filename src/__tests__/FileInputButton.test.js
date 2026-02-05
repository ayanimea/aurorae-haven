/**
 * Tests for FileInputButton component
 * Validates button behavior, file selection, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FileInputButton from '../components/common/FileInputButton'

describe('FileInputButton Component', () => {
  const mockOnFileSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders button with children text', () => {
      render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      expect(
        screen.getByRole('button', { name: /import/i })
      ).toBeInTheDocument()
    })

    test('renders with custom className', () => {
      render(
        <FileInputButton
          onFileSelect={mockOnFileSelect}
          className='btn btn-primary'
        >
          Upload
        </FileInputButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn', 'btn-primary')
    })

    test('renders with default className when not provided', () => {
      render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      expect(screen.getByRole('button')).toHaveClass('btn')
    })

    test('renders with aria-label', () => {
      render(
        <FileInputButton
          onFileSelect={mockOnFileSelect}
          ariaLabel='Import data file'
        >
          Import
        </FileInputButton>
      )

      expect(
        screen.getByRole('button', { name: /import data file/i })
      ).toBeInTheDocument()
    })

    test('renders with title attribute', () => {
      render(
        <FileInputButton onFileSelect={mockOnFileSelect} title='Import data'>
          Import
        </FileInputButton>
      )

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Import data')
    })
  })

  describe('File Input', () => {
    test('contains hidden file input', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('sr-only')
    })

    test('file input has correct accept attribute', () => {
      const { container } = render(
        <FileInputButton
          onFileSelect={mockOnFileSelect}
          accept='application/json'
        >
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', 'application/json')
    })

    test('file input has default accept="*" when not specified', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', '*')
    })

    test('file input is hidden from accessibility tree', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-hidden', 'true')
      expect(fileInput).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Interactions', () => {
    test('clicking button triggers file input click', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const button = screen.getByRole('button')
      const fileInput = container.querySelector('input[type="file"]')

      // Mock the click method
      const clickSpy = jest.spyOn(fileInput, 'click')

      fireEvent.click(button)

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    test('selecting file calls onFileSelect callback', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')

      const file = new File(['{"test": "data"}'], 'test.json', {
        type: 'application/json'
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
      expect(mockOnFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            files: expect.arrayContaining([file])
          })
        })
      )
    })

    test('does not call onFileSelect when no file selected', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')

      fireEvent.change(fileInput, { target: { files: [] } })

      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('Disabled state', () => {
    test('renders disabled button when disabled prop is true', () => {
      render(
        <FileInputButton onFileSelect={mockOnFileSelect} disabled={true}>
          Import
        </FileInputButton>
      )

      expect(screen.getByRole('button')).toBeDisabled()
    })

    test('does not trigger file input when button is disabled', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect} disabled={true}>
          Import
        </FileInputButton>
      )

      const button = screen.getByRole('button')
      const fileInput = container.querySelector('input[type="file"]')
      const clickSpy = jest.spyOn(fileInput, 'click')

      fireEvent.click(button)

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('button has correct type attribute', () => {
      render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    test('file input is properly hidden for screen readers', () => {
      const { container } = render(
        <FileInputButton onFileSelect={mockOnFileSelect}>
          Import
        </FileInputButton>
      )

      const fileInput = container.querySelector('input[type="file"]')

      // Screen reader should not announce the file input
      expect(fileInput).toHaveAttribute('aria-hidden', 'true')
      // Should not be keyboard accessible
      expect(fileInput).toHaveAttribute('tabIndex', '-1')
      // Visually hidden class
      expect(fileInput).toHaveClass('sr-only')
    })
  })
})
