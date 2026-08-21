---
name: Glass Monochrome
font:
  family: Inter
  source: Google Fonts
  import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
icons:
  library: Heroicons
  source: "https://heroicons.com/"
  style: outline
  size: 20px
  strokeWidth: 1.5
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#20201f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#ffffff'
  on-tertiary: '#2b276a'
  tertiary-container: '#e3dfff'
  on-tertiary-container: '#605ca2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c4c0ff'
  on-tertiary-fixed: '#150e55'
  on-tertiary-fixed-variant: '#423e82'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.25'
    letterSpacing: '0'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.03em
rounded:


  DEFAULT: rounder (normail railwind)

spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system keeps the "Glass Monochrome" identity but tightens it up to behave like a standard, production-grade UI kit rather than a showcase layout. The brand personality is still precise and clean, but the emphasis shifts from decorative "floating glass" effects toward density, legibility, and conventional web layout patterns. Glass/blur styling is now an accent used sparingly (overlays, modals, nav bars) rather than the default treatment for every surface.

The typeface is **Inter**, loaded from **Google Fonts**. Always include the Google Fonts import (or a self-hosted equivalent) and fall back to the system font stack so text never breaks before the web font loads:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

## Icons

Use **[Heroicons](https://heroicons.com/)** for all interface iconography where an icon is required (nav items, buttons, inputs, list markers, empty states, etc.). Do not mix in other icon sets — Heroicons' consistent 24x24 grid and stroke weight matches the clean, systematic feel of the Inter type scale.

- **Default style:** `Outline` (1.5px stroke) for most UI — nav, buttons, list rows, form fields.
- **Solid variant:** Reserve for small sizes (≤16px) or filled/active states (e.g. a selected tab, a toggled-on icon button) where thin strokes lose clarity.
- **Size:** 20px is the standard inline size next to `body-md`/`label-md` text; 16px for compact chips/tags; 24px for standalone icon buttons or empty-state illustrations.
- **Color:** Icons inherit `on-surface` / `on-surface-variant` by default. Only shift to the lavender/cyan accent colors to indicate an active or AI-driven state, consistent with how those colors are used elsewhere in this system.
- **Install:** via npm (`@heroicons/react`, `@heroicons/vue`) for framework projects, or inline SVG for plain HTML — do not hotlink icons from the Heroicons site directly.

## Colors

Unchanged monochrome foundation. Ethereal lavender (#B6B2FF), cyan (#8FE3FF), and silver (#E0E0E0) remain reserved for active/AI states only — not for general decoration. Glass surfaces should now be the exception, not the rule: use them for overlays, dropdowns, and modals, not for every card on the page.

## Typography

Still Inter throughout, but the scale has been pulled in closer to standard web type ramps (16px base body copy, 40px max headline) instead of the oversized "hero" scale. Line-heights are tightened slightly (1.2–1.5) so text blocks read as normal paragraphs rather than airy display copy. Hierarchy still comes from weight and size, not color.

## Layout & Spacing

Spacing has been reduced across the board to match conventional web density — think standard SaaS dashboards, not marketing landing pages.

- **Base unit:** 4px (was 8px), giving a tighter, more standard 4/8/16/24/32 scale instead of 8/24/48/80.
- **Grid:** Standard 12-column responsive grid on desktop, collapsing to a single column on mobile — no oversized gutters.
- **Margins:** 24px page margin on desktop, 16px on mobile (previously 32px/16px). Gutters are 16px (previously 24px).
- **Component padding:** Cards and panes use `sm`–`md` (8–16px) internal padding by default. Reserve `lg`/`xl` for section-level spacing only, not for every component.
- **No exaggerated "island" spacing.** Content should sit close enough together to feel like a normal, information-dense interface, not isolated floating blocks with large gaps between them.

## Elevation & Depth

Depth is now used more conservatively:

- **Backdrop Blur:** Reduce to `blur(6px)`–`blur(10px)` and only apply it to genuinely overlapping surfaces (modals, dropdowns, sticky headers) — not to every card.
- **Surface Tiers:**
  - **Level 0 (Background):** Solid dark neutral. Keep background glows subtle and optional, not a default requirement.
  - **Level 1 (Panes):** Mostly solid `surface-container` colors with a 1px hairline border. Reserve translucency for genuine overlay contexts.
  - **Level 2 (Modals/Popovers):** 60–70% opacity with blur and a soft shadow — this is where glass effects are appropriate.
- Standard `box-shadow` elevation (small/medium/large) should be the default depth cue for ordinary cards; blur/glass is the exception reserved for overlay layers.

## Shapes

corndr are should "rounded" for buttons . 



- **Standard Elements:** Buttons (just rounded), inputs, tags — `0.25rem` (4px), matching common UI conventions.
- **Cards & Panes:** `0.375rem`–`0.5rem` (6–8px).
- **Large Sections / Modals:** `0.75rem` (12px) maximum. Avoid large 16–24px radii except for special marketing surfaces.
- Avoid pill-shaped elements outside of tags/badges and toggle controls — buttons and inputs should read as standard rectangular UI, not overly rounded or playful shapes.

## Components

### Buttons
- **Primary:** Solid charcoal/black with white text, 4px radius, standard padding (8px vertical / 16px horizontal). Glass-sheen variant is optional, used sparingly on dark hero sections only.
- **Secondary:** 1px solid border (outline color), same radius and padding as primary, no blur.

### Cards
- Solid `surface-container` background by default with a 1px hairline border and a standard drop shadow. Padding reduced to `sm`–`md` (8–16px). Blur is optional and reserved for cards that visually overlap other content.

### Input Fields
- Standard 4-sided 1px border, 4px radius, `sm` (8px) internal padding. Background one step darker than the surrounding surface for subtle inset contrast. No heavy blur.

### Chips & Tags
- Small pill shape (radius: full) is still fine here since it's a standard convention for tags. Keep padding compact (4px vertical / 8px horizontal). Use lavender/cyan text sparingly for categorization.

### Lists
- Low-opacity horizontal dividers between rows. Vertical padding reduced to `xs`–`sm` (4–8px) per row to keep lists dense and scannable, matching standard list/table conventions.
