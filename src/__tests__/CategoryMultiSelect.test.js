import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import CategoryMultiSelect from '../components/common/CategoryMultiSelect'

describe('CategoryMultiSelect', () => {
  it('exposes a named group and lets a person select several categories', () => {
    const onChange = vi.fn()
    const props = {
      categories: ['Uncategorised', 'Work', 'Personal'],
      defaultCategory: 'Uncategorised',
      onChange
    }
    const { rerender } = render(
      <CategoryMultiSelect value={['Uncategorised']} {...props} />
    )

    const group = screen.getByRole('group', { name: 'Categories' })
    expect(group).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Work' }))
    expect(onChange).toHaveBeenLastCalledWith(['Work'])

    rerender(<CategoryMultiSelect value={['Work']} {...props} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Personal' }))
    expect(onChange).toHaveBeenLastCalledWith(['Work', 'Personal'])
  })

  it('keeps Uncategorised exclusive and presents it as the only default option', () => {
    const onChange = vi.fn()
    render(
      <CategoryMultiSelect
        value={['Work', 'Personal']}
        categories={['Uncategorised', 'Unassigned', 'Work', 'Personal']}
        defaultCategory='Uncategorised'
        onChange={onChange}
      />
    )

    expect(
      screen.queryByRole('checkbox', { name: 'Unassigned' })
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Uncategorised' })
    )
    expect(onChange).toHaveBeenLastCalledWith(['Uncategorised'])
  })
})
