import { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from './Icon'

function CategoryTabs({ categories, selectedCategory, onSelect, onAddCategory }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const handleAdd = (event) => {
    event.preventDefault()
    const category = newCategory.trim()
    if (!category) return
    onAddCategory(category)
    onSelect(category)
    setNewCategory('')
    setIsAdding(false)
  }

  const handleTabKeyDown = (event, index) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const tabs = event.currentTarget.parentElement.querySelectorAll(
      '[role="tab"]'
    )
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + tabs.length) % tabs.length
    tabs[nextIndex].focus()
    onSelect(nextIndex === 0 ? null : categories[nextIndex - 1])
  }

  return (
    <div className='category-tabs-row'>
      <div className='category-tabs' role='tablist' aria-label='Categories'>
        <button
          type='button'
          role='tab'
          aria-selected={selectedCategory === null}
          className={selectedCategory === null ? 'active' : ''}
          onClick={() => onSelect(null)}
          onKeyDown={(event) => handleTabKeyDown(event, 0)}
        >
          All
        </button>
        {categories.map((category, index) => (
          <button
            type='button'
            role='tab'
            aria-selected={selectedCategory === category}
            className={selectedCategory === category ? 'active' : ''}
            key={category}
            onClick={() => onSelect(category)}
            onKeyDown={(event) => handleTabKeyDown(event, index + 1)}
          >
            {category}
          </button>
        ))}
      </div>
      {isAdding ? (
        <form className='category-tab-form' onSubmit={handleAdd}>
          <input
            type='text'
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            aria-label='New category name'
            autoComplete='off'
          />
          <button type='submit' aria-label='Save category'>
            <Icon name='check' />
          </button>
          <button
            type='button'
            onClick={() => {
              setNewCategory('')
              setIsAdding(false)
            }}
            aria-label='Cancel adding category'
          >
            <Icon name='x' />
          </button>
        </form>
      ) : (
        <button
          type='button'
          className='category-add-button'
          onClick={() => setIsAdding(true)}
          aria-label='Add category'
        >
          <Icon name='plus' />
        </button>
      )}
    </div>
  )
}

CategoryTabs.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired
}

export default CategoryTabs
