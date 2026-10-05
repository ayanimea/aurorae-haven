# 🌌 Aurorae Haven – Roadmap

> **Aurorae Haven** is a productivity app designed for neurodivergent users.
> It helps manage routines, tasks, habits, notes, and stats with a calm, astro-themed interface.
> Notes support Markdown import/export. Full-app backups use JSON. Some completion flows include haptics or confetti; scheduled reminders remain planned.

> **Reading this roadmap:** It contains historical milestones and future ideas. Items marked as planned are not current app features.

---

## Alpha – Internal Prototype 🛠️

- Minimal routine runner (steps + timer)
- Notes with **Markdown import/export**
- Basic task manager
- JSON export/import
- Early design tokens (colours, typography)
- Initial localStorage persistence (historical; storage is now split between localStorage and IndexedDB)

---

## Beta – Public Preview ⚡

- All MVP modules: routines, tasks (Eisenhower), habits, notes/brain dump
- Safeguard before closing tab (unsaved data warning)
- Responsive layout (desktop / tablet / mobile)
- Accessibility baseline (keyboard navigation, ARIA roles, colour contrast)
- Strict CSP + modular code
- Feedback collection loop (issues/discussions)

---

## v1.0 – Core MVP Release 🚀

- Stable, polished codebase
- Documentation (README, specs, security notes)
- Stats foundation (track routine time, structured data)
- Export/import across all modules
- **Automatic save feature with File System Access API** ✅
  - Configurable save intervals and directory
  - Load last save functionality
  - Automatic cleanup of old save files
- Consistent design tokens + Glass-UI visuals

---

## v2.0 – Analytics & Gamification 🌟

- Advanced statistics dashboards (charts, streaks, trends)
- Broader XP, levelling, achievements, streaks, and feedback features
- Scheduled notifications and reminders for tasks, routines, and habits
- **Android .APK packaging** (PWA → APK with build instructions)
- Extended documentation (stats, gamification, notifications)

---

## Future (v3.0+) 🔭

- User accounts + secure cloud sync
- Collaboration/sharing (routines, notes)
- Mobile-native wrappers (Android/iOS)
- Personalisation features (themes, settings)
