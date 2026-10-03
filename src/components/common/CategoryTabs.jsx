import PropTypes from 'prop-types'

function CategoryTabs({ categories, selectedCategory, onSelect }) {
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
    </div>
  )
}

CategoryTabs.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string,
  onSelect: PropTypes.func.isRequired
}

export default CategoryTabs
