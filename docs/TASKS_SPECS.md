# Tasks

This document describes how Tasks works today. It is a short reference for users and contributors, not a list of planned features.

## Quick use

1. Choose **All** or a category in the workspace navigation.
2. Choose an Eisenhower quadrant.
3. Enter a task and select its workspace categories.
4. Use **More** on a task to add a subtask or change its categories.

You can also add a task from a saved task or a built-in template. Tasks can be moved between quadrants by dragging them. Use the available task actions to promote a subtask or nest an item when dragging is not suitable.

## Categories

- Categories are shared with Notes, Habits, Routines, Schedule, Stats, and Library.
- Create and rename categories in **Settings**. Up to six custom categories can be created.
- A task can have several categories.
- **Uncategorised** is the default and must be selected on its own.
- Items with no category remain available in every category workspace.
- A legacy backup imported without category data is updated with the **Unassigned** category.

Subtasks inherit their parent task's categories. Changing the parent's categories updates its subtasks.

## Global task limits

Limits apply across all categories:

| Task type | Maximum tasks |
| --- | ---: |
| Urgent & Important | 4 |
| Important (both Important quadrants combined) | 10 |
| Urgent (both Urgent quadrants combined) | 10 |

Limits count top-level tasks across categories, including completed tasks. Subtasks do not count as top-level tasks. Moving, creating from a template, and promoting a subtask respect these limits.

## Data and backups

- Tasks are persisted in local storage using the `aurorae_tasks` key.
- App-wide JSON backups include task and category data.
- Importing older data adds **Unassigned** to tasks that have no categories.
- Data stays in the browser unless a person exports it.

## Accessibility and ease of use

- Task fields and category controls have accessible names.
- Task completion uses a standard checkbox.
- The **More** menu provides category and subtask actions without requiring drag-and-drop.
- Use the task-level **Make task** action to promote a subtask when pointer dragging is unavailable.

These interaction choices provide alternatives to dragging. This document does not claim that every app flow has been independently certified against WCAG.

## Code and tests

- State and persistence: `src/hooks/useTasksState.js`, `src/utils/tasksStorage.js`
- Task form and controls: `src/components/Tasks/TaskForm.jsx`, `src/components/Tasks/TaskItem.jsx`
- Shared category logic: `src/utils/itemCategories.js`
- Tests: `src/__tests__/Tasks.test.js`, `src/__tests__/itemCategories.test.js`, `src/__tests__/dataManager.test.js`
