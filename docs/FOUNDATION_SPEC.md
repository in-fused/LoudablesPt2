# FOUNDATION SPEC

## Mandatory Foundation

- Mobile-first PWA architecture
- Conversation-first interaction model
- Family-life Spanish priority
- Clear separation of UI, logic, and content
- Additive, non-destructive structural evolution

## Current Implementation Baseline

- React + Vite + plain JS/CSS
- Portrait-first shell with scene (top) and drawer (bottom)
- Content loaded from JSON files in `/src/data`
- Feature hooks in `/src/features`
- Shared utilities in `/src/lib`
- PWA manifest and service worker in `/public`

## Device and Interaction Constraints

- Touch-first controls
- No hover-only dependencies
- No keyboard-required core flow
- Comfortable tap targets (~48px minimum)
- Safe-area aware shell padding for iPhone
