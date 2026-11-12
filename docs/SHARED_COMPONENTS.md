# Shared Components Guide

This document describes the shared/reusable components available in the Aurorae Haven codebase.

## Available Shared Components

### 1. Icon Component (`src/components/common/Icon.jsx`)

**Purpose**: Centralized SVG icon library to eliminate duplication

**Usage**:

```javascript
import Icon from '../components/common/Icon'

// Basic usage
<Icon name="plus" />
<Icon name="trash" />
<Icon name="edit" />

// With custom className
<Icon name="check" className="custom-icon" />
```

**Available Icons**:

- `plus` - Add/create action
- `x` - Close/cancel action
- `check` - Confirm/save action
- `edit` - Edit action
- `trash` / `trashAlt` - Delete action
- `upload` / `download` - Import/export actions
- `lock` / `unlock` - Lock state icons
- `menu` - Menu/list icon
- `filter` - Filter icon
- `info` - Information icon
- `helpCircle` - Help icon

**Benefits**:

- Eliminates ~46 duplicate SVG definitions
- Single source of truth for icons
- Easy to add new icons
- Consistent styling

### 2. Modal Component (`src/components/common/Modal.jsx`)

**Purpose**: Reusable modal wrapper with consistent structure

**Usage**:

```javascript
import Modal from '../components/common/Modal'
;<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title='Modal Title'
>
  <p>Modal content goes here</p>
</Modal>
```

**Props**:

- `isOpen` (boolean, required) - Controls visibility
- `onClose` (function, required) - Close handler
- `title` (string, optional) - Modal title
- `children` (node, required) - Modal content
- `className` (string, optional) - Additional CSS classes

**Features**:

- Consistent overlay and backdrop
- Keyboard support (ESC to close)
- Click outside to close
- Accessible (ARIA labels, focus management)
- Auto-includes close button in header

**Existing Modals to Migrate**:

- FilterModal (BrainDump)
- NoteDetailsModal (BrainDump)
- HelpModal (BrainDump)
- Future Settings modals

### 3. Button Component (`src/components/common/Button.jsx`)

**Purpose**: Standardized button with icon support

**Usage**:

```javascript
import Button from '../components/common/Button'

// Basic button
<Button onClick={handleClick}>Click Me</Button>

// With icon
<Button icon="plus" onClick={handleAdd}>Add Item</Button>

// Different variants
<Button variant="primary">Primary</Button>
<Button variant="delete">Delete</Button>
<Button variant="icon" icon="edit" ariaLabel="Edit" />
```

**Props**:

- `children` (node) - Button text/content
- `onClick` (function) - Click handler
- `icon` (string) - Icon name from Icon component
- `variant` (string) - Button style variant
  - `default` - Standard button
  - `primary` - Primary action button
  - `icon` - Icon-only button
  - `delete` - Delete/destructive action
  - `save` / `cancel` / `edit` - Action-specific styles
- `disabled` (boolean) - Disabled state
- `type` (string) - HTML button type
- `className` (string) - Additional CSS classes
- `ariaLabel` (string) - Accessibility label
- `title` (string) - Tooltip text

**Benefits**:

- Consistent button styling
- Built-in icon support
- Accessibility built-in
- Reduces boilerplate

## Custom Hooks

### 4. useNotesState (`src/hooks/useNotesState.js`)

**Purpose**: Manages Notes state, autosaving, filters, and category assignments.

**Returns**:

```javascript
const {
  notes, // Array of notes
  currentNoteId, // Current note ID
  currentNote, // Current note object
  title, // Current note title
  content, // Current note content
  category, // Primary category for compatibility
  assignedCategories, // All workspace categories for the current note
  searchQuery, // Search query
  filterOptions, // Filter settings
  filteredNotes, // Filtered notes array
  setTitle, // Update title
  setContent, // Update content
  setAssignedCategories, // Update all workspace categories
  setSearchQuery, // Update search
  setFilterOptions, // Update filters
  loadNote, // Load a note
  createNote, // Create new note
  updateNotes // Update notes array
} = useNotesState()
```

**Features**:

- Automatic localStorage persistence
- Migration from old format
- Debounced autosave (500ms)
- Shared multi-category assignment; sub-notes follow their parent's categories
- Note filtering and searching
- Memoized computed values

### 5. useTasksState (`src/hooks/useTasksState.js`)

**Purpose**: Manages Tasks (Eisenhower Matrix) state

**Returns**:

```javascript
const {
  tasks, // Tasks by quadrant
  setTasks, // Update all tasks
  addTask, // Add new task
  toggleTask, // Toggle completion
  deleteTask, // Delete task
  editTask, // Edit task text
  updateTaskCategory, // Assign workspace categories
  addSubtask, // Add a child task
  moveTask // Move task between quadrants
} = useTasksState()
```

**Features**:

- Automatic localStorage persistence
- Secure UUID generation
- Quadrant-based organization
- Shared multi-category assignment; subtasks inherit their parent's categories
- Error handling for storage quota

### 6. useDragAndDrop (`src/hooks/useDragAndDrop.js`)

**Purpose**: Generic drag and drop functionality

**Usage**:

```javascript
const {
  draggedTask,
  handleDragStart,
  handleDragOver,
  handleDrop
} = useDragAndDrop(onDrop)

// In component:
<div
  draggable
  onDragStart={() => handleDragStart(quadrant, task)}
  onDragOver={handleDragOver}
  onDrop={() => handleDrop(targetQuadrant)}
>
```

**Benefits**:

- Reusable drag and drop logic
- Handles browser events
- Clean separation from UI

### 7. useToast (`src/hooks/useToast.js`)

**Purpose**: Toast notification system

**Returns**:

```javascript
const {
  toastMessage, // Current message
  showToast, // Visibility state
  showToastNotification // Show notification function
} = useToast()

// Usage:
showToastNotification('✓ Saved successfully')
```

**Features**:

- Auto-dismiss after 3 seconds
- Simple API
- Non-intrusive notifications

## CSS Modules (New!)

The CSS has been refactored into focused modules:

### File Structure

```text
src/assets/styles/
├── styles.css           # Main file (19 lines) - imports all modules
├── base.css             # Variables, reset, body (80 lines)
├── navigation.css       # App bar, tabs, menu (504 lines)
├── schedule.css         # Schedule page (106 lines)
├── routines.css        # Routines page (202 lines)
├── brain-dump.css       # Brain Dump page (485 lines)
├── tasks.css            # Tasks page (322 lines)
├── modal.css            # Modal components (351 lines)
└── help-modal.css       # Help modal (227 lines)
```

**Total**: 2,277 lines (distributed across 9 focused files)
**Before**: 2,051 lines (in 1 monolithic file)

### Benefits

1. **Maintainability**: Each file focuses on one feature
2. **Performance**: Browser can cache modules independently
3. **Collaboration**: Multiple developers can work on different modules
4. **Organization**: Clear separation by feature
5. **All files under 600 lines**: Meets size targets

### CSS Import Order

The main `styles.css` imports in this order:

1. Base (variables, reset)
2. Navigation (global UI)
3. Feature-specific (schedule, routines, brain-dump, tasks)
4. Common components (modals)

## Migration Guide

### To Use Icon Component

**Before**:

```javascript
<svg className='icon' viewBox='0 0 24 24'>
  <path d='M12 5v14M5 12h14' />
</svg>
```

**After**:

```javascript
<Icon name='plus' />
```

### To Use Modal Component

**Before**:

```javascript
<div className='modal-overlay' onClick={onClose}>
  <div className='modal-content' onClick={(e) => e.stopPropagation()}>
    <div className='modal-header'>
      <h2>Title</h2>
      <button onClick={onClose}>×</button>
    </div>
    <div className='modal-body'>{children}</div>
  </div>
</div>
```

**After**:

```javascript
<Modal isOpen={showModal} onClose={onClose} title='Title'>
  {children}
</Modal>
```

### To Use Button Component

**Before**:

```javascript
<button className='btn btn-primary' onClick={handleClick} aria-label='Add'>
  <svg className='icon' viewBox='0 0 24 24'>
    <path d='M12 5v14M5 12h14' />
  </svg>
  Add Item
</button>
```

**After**:

```javascript
<Button variant='primary' icon='plus' onClick={handleClick} ariaLabel='Add'>
  Add Item
</Button>
```

## Future Enhancements

### Planned Shared Components

1. **FormInput** - Standardized form inputs
2. **Card** - Reusable card container
3. **Toolbar** - Common toolbar pattern
4. **EmptyState** - Consistent empty state UI
5. **LoadingSpinner** - Loading indicators

### Planned Hooks

1. **useLocalStorage** - Generic localStorage hook
2. **useDebounce** - Debouncing utility
3. **useKeyboardShortcuts** - Keyboard navigation
4. **useMediaQuery** - Responsive breakpoints

## Best Practices

1. **Always use shared components** when available
2. **Check this guide** before creating new components
3. **Propose additions** to shared library when you see patterns
4. **Document new shared components** in this file
5. **Follow the established patterns** for consistency

## Questions?

Open an issue or PR to discuss additions to the shared component library.
