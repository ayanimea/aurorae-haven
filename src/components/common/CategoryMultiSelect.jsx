import PropTypes from 'prop-types'
import { normalizeCategorySelection } from '../../utils/itemCategories'

function CategoryMultiSelect({
  value,
  categories,
  defaultCategory,
  onChange,
  label = 'Categories',
  className = '',
  disabled = false
}) {
  const selected = Array.isArray(value) ? value : []

  const handleChange = (category, checked) => {
    const current = selected.filter((item) => item !== defaultCategory)
    const next = checked
      ? category === defaultCategory
        ? [defaultCategory]
        : [...current, category]
      : current.filter((item) => item !== category)
    onChange(normalizeCategorySelection(next, defaultCategory))
  }

  return (
    <fieldset
      className={`category-multi-select ${className}`.trim()}
      disabled={disabled}
    >
      <legend>{label}</legend>
      <div className='category-multi-select-options'>
        {categories.map((category) => (
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
