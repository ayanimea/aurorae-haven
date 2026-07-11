/**
 * Note templates for the Brain Dump new-note modal.
 *
 * Each template has:
 *  - id          {string}  Unique identifier
 *  - name        {string}  Display name shown in the modal
 *  - description {string}  Short description shown under the name
 *  - emoji       {string}  Decorative emoji for the card
 *  - content     {string}  Default markdown content (no TOC marker — added on demand)
 */

export const NOTE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from an empty note',
    emoji: '📄',
    content: ''
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Capture your thoughts, moods and wins for the day',
    emoji: '📔',
    content: `# ${new Date().toLocaleDateString('en-CA')} — Daily Journal

## Morning Check-in

- **Mood:** 
- **Energy:** 
- **Intention for today:** 

## Tasks & Goals

- [ ] 
- [ ] 
- [ ] 

## Notes & Thoughts

## Evening Reflection

- **What went well:** 
- **What I'm grateful for:** 
- **Tomorrow's priority:** `
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Record agenda, attendees, decisions and action items',
    emoji: '🗓️',
    content: `# Meeting Notes — ${new Date().toLocaleDateString('en-CA')}

**Date:** ${new Date().toLocaleDateString()}  
**Attendees:**  
**Facilitator:**  

## Agenda

1. 
2. 
3. 

## Discussion

## Decisions

## Action Items

| Action | Owner | Due |
|--------|-------|-----|
|        |       |     |

## Next Meeting

`
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    description: 'Outline goals, milestones and resources for a project',
    emoji: '🗂️',
    content: `# Project: 

## Overview

**Goal:**  
**Deadline:**  
**Status:** 🟡 In Progress

## Objectives

- [ ] 
- [ ] 
- [ ] 

## Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
|           |             |        |

## Resources & References

- [[Related Note]]

## Notes

`
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Free-flow ideas without structure',
    emoji: '💡',
    content: `# Brainstorm — 

## Core Idea



## Related Ideas

- 
- 
- 

## Questions to Explore

- 
- 

## Next Steps

- [ ] 
`
  }
]

/**
 * Return a template object by id, or null if not found.
 * @param {string} id
 * @returns {Object|null}
 */
export function getNoteTemplateById(id) {
  return NOTE_TEMPLATES.find((t) => t.id === id) ?? null
}
