# 🧠 Schedule UI — Copilot-Only Instructions

This file exists **only** to steer Copilot / LLMs.
It is not design documentation.

If you are human, stop reading.

---

## ABSOLUTE RULES (DO NOT VIOLATE)

1. Time-of-day bands are NOT row backgrounds.
2. Do NOT use a single global gradient for the schedule.
3. Bands MUST be discrete zones (morning / afternoon / evening / night).
4. Bands MUST be perceptible without reading hour labels.
5. Event cards MUST visually dominate over background and grid.
6. Do NOT hardcode pixel heights for time (no `height: 64px`).
7. All vertical sizing derives from a minute-based CSS variable.
8. If unsure, DO NOT SIMPLIFY. Preserve structure.

If the schedule looks calm but disorienting, it is WRONG.
