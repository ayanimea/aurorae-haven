/**
 * Tests for Button component
 * Validates button rendering, variants, and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../components/common/Button'

describe('Button Component', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders button with children text', () => {
      render(<Button onClick={mockOnClick}>Click me</Button>)

      expect(
        screen.getByRole('button', { name: /click me/i })
      ).toBeInTheDocument()
    })

    test('renders with default variant', () => {
      render(<Button onClick={mockOnClick}>Button</Button>)

      expect(screen.getByRole('button')).toHaveClass('btn')
    })

    test('renders with primary variant', () => {
      render(
        <Button onClick={mockOnClick} variant='primary'>
          Primary
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn', 'btn-primary')
    })

    test('renders with icon variant', () => {
      render(
        <Button onClick={mockOnClick} variant='icon'>
          Icon
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn', 'btn-icon')
    })

    test('renders with delete variant', () => {
      render(
        <Button onClick={mockOnClick} variant='delete'>
          Delete
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn', 'btn-delete')
    })

    test('renders with save variant', () => {
      render(
        <Button onClick={mockOnClick} variant='save'>
          Save
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn-save')
    })

    test('renders with cancel variant', () => {
      render(
        <Button onClick={mockOnClick} variant='cancel'>
          Cancel
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn-cancel')
    })

    test('renders with edit variant', () => {
      render(
        <Button onClick={mockOnClick} variant='edit'>
          Edit
        </Button>
      )

      expect(screen.getByRole('button')).toHaveClass('btn-edit')
    })

    test('applies custom className in addition to variant class', () => {
      render(
        <Button
          onClick={mockOnClick}
          variant='primary'
          className='custom-class'
        >
          Button
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn', 'btn-primary', 'custom-class')
    })

    test('renders with icon when icon prop is provided', () => {
      const { container } = render(
        <Button onClick={mockOnClick} icon='settings'>
          Settings
        </Button>
      )

      // Icon component renders an SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders icon before children text', () => {
      const { container } = render(
        <Button onClick={mockOnClick} icon='settings'>
          Settings
        </Button>
      )

      const button = screen.getByRole('button')
      const svg = container.querySelector('svg')

      // SVG should come before the text node
      expect(button.firstChild).toBe(svg)
    })
  })

  describe('Button types', () => {
    test('has default type="button"', () => {
      render(<Button onClick={mockOnClick}>Button</Button>)

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    test('can be type="submit"', () => {
      render(
        <Button onClick={mockOnClick} type='submit'>
          Submit
        </Button>
      )

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    test('can be type="reset"', () => {
      render(
        <Button onClick={mockOnClick} type='reset'>
          Reset
        </Button>
      )

      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset')
    })
  })

  describe('Interactions', () => {
    test('calls onClick when clicked', () => {
      render(<Button onClick={mockOnClick}>Click</Button>)

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    test('does not call onClick when disabled', () => {
      render(
        <Button onClick={mockOnClick} disabled={true}>
          Click
        </Button>
      )

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Disabled state', () => {
    test('is not disabled by default', () => {
      render(<Button onClick={mockOnClick}>Button</Button>)

      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    test('is disabled when disabled prop is true', () => {
      render(
        <Button onClick={mockOnClick} disabled={true}>
          Button
        </Button>
      )

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    test('has aria-label when provided', () => {
      render(
        <Button onClick={mockOnClick} ariaLabel='Custom aria label'>
          Button
        </Button>
      )

      expect(
        screen.getByRole('button', { name: /custom aria label/i })
      ).toBeInTheDocument()
    })

    test('has title attribute when provided', () => {
      render(
        <Button onClick={mockOnClick} title='Button title'>
          Button
        </Button>
      )

      expect(screen.getByRole('button')).toHaveAttribute(
        'title',
        'Button title'
      )
    })

    test('aria-label takes precedence over children for accessible name', () => {
      render(
        <Button onClick={mockOnClick} ariaLabel='Accessible name'>
          Visual text
        </Button>
      )

      // Should find by aria-label
      expect(
        screen.getByRole('button', { name: /accessible name/i })
      ).toBeInTheDocument()
    })
  })

  describe('PropTypes validation', () => {
    test('renders without onClick (optional)', () => {
      render(<Button>Button</Button>)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('renders with all props', () => {
      render(
        <Button
          onClick={mockOnClick}
          icon='search'
          variant='primary'
          disabled={false}
          type='button'
          className='extra-class'
          ariaLabel='Search button'
          title='Search'
        >
          Search
        </Button>
      )

      const button = screen.getByRole('button', { name: /search button/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-primary', 'extra-class')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('title', 'Search')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Edge cases', () => {
    test('handles invalid variant gracefully', () => {
      render(
        <Button onClick={mockOnClick} variant='invalid-variant'>
          Button
        </Button>
      )

      // Should fallback to default 'btn' class
      expect(screen.getByRole('button')).toHaveClass('btn')
    })

    test('handles empty className prop', () => {
      render(
        <Button onClick={mockOnClick} className=''>
          Button
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn')
      expect(button.className).not.toContain('  ') // No double spaces
    })

    test('renders without children (icon only button)', () => {
      const { container } = render(
        <Button onClick={mockOnClick} icon='x' ariaLabel='Close' />
      )

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })
})
