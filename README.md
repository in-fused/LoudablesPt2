# Loudables (Phase 1 Scaffold)

Mobile-first, conversation-first Spanish learning PWA focused on real family-life communication.

## Tech Stack

- React + Vite
- Plain JavaScript
- Plain CSS
- PWA manifest + service worker

## Phase 1 Scope

- Repo scaffold
- Mobile app shell (portrait-first)
- Scene placeholder + bottom drawer placeholder
- Starter JSON content for scene/dialogue/vocabulary/grammar
- Minimal progress persistence utility
- Separation of UI, logic, and content

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Service Worker Behavior

- Local development (`npm run dev`): service worker is not registered and any existing registration is cleared.
- Production build/preview: service worker registers normally.
- Service worker caches only safe same-origin app assets and skips unsupported/dev-runtime request types.

## Notes

- Primary target: iPhone Safari + installed home-screen PWA.
- Layout is tuned for 320px to 430px widths.
- Core flow is touch-first and does not require keyboard input.
