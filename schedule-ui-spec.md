# 🗓 Schedule UI — Canonical Visual Specification

This document is the **source of truth** for the Schedule UI.
If implementation diverges from this file, the implementation is wrong.

---

## 0. Copilot / LLM Instruction Header (MANDATORY)

This header **must be copied verbatim** at the top of:
- `Schedule.tsx` / `Schedule.jsx`
- the main schedule CSS file
- or any file where Copilot generates Schedule-related code

```md
<!--
COPILOT / LLM INSTRUCTIONS — SCHEDULE UI (DO NOT SIMPLIFY)

This Schedule UI is intentionally subtle and layered.
Do NOT approximate, simplify, or “clean up” the visuals.

Key constraints (NON-NEGOTIABLE):

1. Time-of-day styling is NOT row coloring.
   - Do NOT apply background colors to hour rows.
   - Do NOT use a single global background gradient.
   - Time-of-day bands MUST be implemented as a separate,
     absolutely-positioned background layer.

2. The schedule has FOUR visual layers, in this order:
   1) Event cards (primary focus)
   2) Current-time indicator (if present)
   3) Hour grid lines (structural only)
   4) Time-of-day bands (semantic orientation)
   Decorative backgrounds are below all of the above.

3. Time-of-day bands are SEMANTIC, not decorative.
   - Morning / Afternoon / Evening / Night MUST be perceptible
     without reading hour labels.
   - Bands must be visually distinct from each other,
     but remain low-contrast and calm.
   - If converting the UI to grayscale makes all hours look identical,
     the implementation is WRONG.

4. Bands must be DISCRETE ZONES, not a continuous gradient.
   - Each band covers a defined time range.
   - Each band has its own soft internal gradient.
   - Adjacent bands may overlap softly, but must differ in hue or luminance.

5. Event cards must visually dominate.
   - Cards float above bands (z-index, elevation).
   - Cards NEVER inherit band colors.
   - If background draws attention before events, FAIL.

6. Time scaling MUST be proportional and non-hardcoded.
   - All vertical sizing derives from a minute-based unit.
   - Do NOT hardcode pixel heights for hours or events.
   - Use CSS variables and calculations only.

7. This UI prioritises ORIENTATION over decoration.
   - Calm but legible.
   - Structured but non-mechanical.
   - If it looks “efficient” but feels disorienting, it is WRONG.

If unsure: DO NOT GUESS.
Ask for clarification or preserve the existing structure.
-->
```

---

## 1. Design Intent (Pinned)

The Schedule is a **map of the day**, not a dashboard.

- Time-of-day bands provide orientation
- Events provide meaning
- Grid provides alignment only

If the background is noticed before the events, the UI has failed.

---

## 2. Time-of-Day Bands (Authoritative)

### Time Ranges

| Band | Time |
|-----|------|
| Morning | 07:00–12:00 |
| Afternoon | 12:00–18:00 |
| Evening | 18:00–23:00 |
| Night | 23:00–07:00 |

Bands:
- are discrete zones
- are perceptible without labels
- fade softly at boundaries
- never use flat fills

---

## 3. Canonical CSS (Extract)

```css
.schedule-bands {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.schedule-band {
  position: absolute;
  left: 0;
  right: 0;
}
```

(See repository docs for full CSS and React examples.)

---

## 4. Time Scaling (Non-Hardcoded)

```css
:root {
  --minute-unit: clamp(1px, 0.15vh, 1.6px);
}
```

**Clamp Function Rationale:**
- **Minimum (1px)**: Ensures events remain visible even on very small screens; prevents collapsing to zero height
- **Scaling Factor (0.15vh)**: Provides responsive sizing where 1 minute ≈ 0.15% of viewport height, allowing the 24-hour day (1440 minutes) to fit comfortably within typical screen heights
- **Maximum (1.6px)**: Caps the minute unit on very large displays to prevent excessive vertical spacing and maintain comfortable scrolling distances

All vertical positioning and sizing derives from this unit.

---

## 5. QA Rejection Rules

Reject any PR that:
- Applies background colors to hour rows
- Uses a single gradient for the entire day
- Hardcodes pixel heights for time
- Makes time-of-day bands imperceptible
- Flattens event cards

---

End of spec.
