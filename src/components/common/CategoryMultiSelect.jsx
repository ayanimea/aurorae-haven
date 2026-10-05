import PropTypes from 'prop-types'
import {
  isUnassignedCategory,
  normalizeCategorySelection
} from '../../utils/itemCategories'

function CategoryMultiSelect({
  value,
  categories,
  defaultCategory,
  onChange,
  label = 'Categories',
  className = '',
  disabled = false
}) {
  const selected = normalizeCategorySelection(value, defaultCategory)
  const visibleCategories = categories.filter(
    (category) =>
      !isUnassignedCategory(category, defaultCategory) ||
      category.toLowerCase() === defaultCategory.toLowerCase()
  )

  const handleChange = (category, checked) => {
    const current = selected.filter(
      (item) => !isUnassignedCategory(item, defaultCategory)
    )
    const next = checked
      ? isUnassignedCategory(category, defaultCategory)
        ? [defaultCategory]
        : [...current, category]
      : current.filter(
          (item) => item.toLowerCase() !== category.toLowerCase()
        )
    onChange(normalizeCategorySelection(next, defaultCategory))
  }

  return (
    <fieldset
      className={`category-multi-select ${className}`.trim()}
      disabled={disabled}
    >
      <legend>{label}</legend>
      <div className='category-multi-select-options'>
        {visibleCategories.map((category) => (
          <label key={category}>
            <input
              type='checkbox'
              checked={selected.includes(category)}
              disabled={disabled}
              onChange={(event) => handleChange(category, event.target.checked)}
            />
            <span>{category}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

CategoryMultiSelect.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultCategory: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool
}

export default CategoryMultiSelect
