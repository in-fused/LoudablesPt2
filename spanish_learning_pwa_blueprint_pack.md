# Spanish Learning PWA Blueprint Pack

## 1. Pre-Req Checklist

### A. Product Intent
- Confirm the primary purpose is practical Spanish for real family-life communication, not academic fluency or test prep.
- Confirm the primary learner is an English-speaking adult beginner/intermediate learner.
- Confirm the learning style is conversation-first, context-first, and visually anchored.
- Confirm the app should feel warm, approachable, and emotionally relevant rather than robotic or school-like.
- Confirm the product should remain adult-usable even if it is playful and family-friendly.

### B. Target Use Cases
- Understand greetings and simple replies at family gatherings.
- Recognize and use common home, food, child, and affection vocabulary.
- Follow short conversational exchanges in context.
- Respond naturally with simple phrases rather than isolated words.
- Build confidence hearing and using Spanish around partner, child, and Spanish-speaking relatives.

### C. MVP Scope Decisions
- Limit MVP to one scene/module.
- Limit MVP vocabulary to roughly 10–20 core items.
- Limit MVP dialogue interactions to roughly 8–12 short exchanges.
- Include translation support, but do not let English dominate the interface.
- Include audio playback, but do not make pronunciation scoring the main mechanic.
- Include local progress persistence.
- Include installable PWA support.

### D. Non-Goals to Lock Before Build
- No native iOS app requirement.
- No native Android app requirement.
- No advanced speech grading/scoring in MVP.
- No large multi-module content library in MVP.
- No heavy gamification or streak pressure in MVP.
- No complex account system unless clearly needed.
- No backend dependency unless local-first MVP proves insufficient.

### E. Platform / Device Requirements
- Primary target: iPhone Safari and iPhone home-screen PWA.
- Secondary target: Android Chrome and Android home-screen PWA.
- Desktop support is responsive but secondary.
- Portrait orientation is primary.
- All core interactions must work by touch.
- Core flows must remain usable without keyboard input.
- UI must respect mobile safe areas and notch behavior.

### F. UX Requirements
- Thumb-friendly tap targets.
- Clear visual hierarchy on small screens.
- No hover-only interactions.
- No cluttered multi-panel desktop layouts forced onto mobile.
- Bottom-sheet or drawer pattern for dialogue/help content.
- Fast reveal of translation, hints, and response choices.
- Friction-free progression through conversations.
- Clear way to replay audio and revisit learned items.

### G. Learning Design Requirements
- Conversation-first learning loop.
- Visual embodiment of vocabulary.
- Grammar explained through examples and transformation first.
- Practical Puerto Rican/family-life relevance where appropriate.
- Repetition should occur through reuse in new contexts, not robotic mic drills.
- Learner should gradually move from recognition to choice to construction.
- Content should prioritize phrases people actually say.

### H. Content System Requirements
- Define a vocabulary schema.
- Define a dialogue schema.
- Define a scene schema.
- Define grammar hint schema.
- Define tagging system for context (home, family, food, child, greetings, etc.).
- Define audio file naming/storage conventions.
- Keep content editable without rewriting UI code.

### I. Technical Architecture Decisions
- Choose frontend framework.
- Choose build tool.
- Choose PWA plugin/service worker approach.
- Choose state management level appropriate for MVP.
- Choose local persistence approach.
- Choose styling strategy.
- Choose animation strategy that stays mobile-lightweight.
- Decide whether audio is local assets or remote-hosted.
- Decide hosting/deployment target.

### J. Repo / Workflow Decisions
- Create initial folder structure before feature work.
- Create docs folder as source of truth.
- Define branch workflow.
- Define naming conventions.
- Define component boundaries.
- Define rule that stable working code is not rewritten casually.
- Define how Codex should receive prompts and constraints.

### K. Quality / Guardrail Requirements
- Create milestone acceptance checklist.
- Create regression checklist for mobile usability.
- Create regression checklist for PWA installability.
- Create regression checklist for touch/audio/dialogue flow.
- Create content-quality checklist to avoid awkward or unnatural Spanish examples.
- Create performance checklist for first-load and interaction smoothness.

### L. Launch-Readiness Basics for MVP
- Home-screen install works.
- App launches with proper icon/name.
- Scene loads reliably on iPhone.
- Audio playback works on tap.
- Dialogue choices work consistently.
- Progress persists across refreshes.
- Basic offline shell support works if feasible.
- No major touch or layout breakage on common mobile widths.

### M. Documentation Set to Complete Before Coding
- Pre-Req Checklist
- PRD
- Guardrails
- Foundation Spec
- Repo Structure / Architecture Blueprint
- Codex Prompting Rules
- Milestone Acceptance Checklist
- Module 1 Content Spec

### N. Final Go / No-Go Questions Before Build Starts
- Are the primary user goals clearly defined?
- Is the MVP intentionally narrow?
- Are non-goals clearly locked?
- Is mobile-first PWA status explicitly non-negotiable?
- Is the content model defined enough to build against?
- Are the repo rules defined?
- Are Codex instructions structured enough to prevent drift?
- Is there a clear acceptance standard for the first prototype?

---

## 2. PRD (Product Requirements Document)

### Product Name (Working)
Casa de Palabras (working title — subject to change)

### Product Type
Mobile-first Progressive Web App (PWA)

### Problem Statement
Existing language learning apps rely heavily on repetition, abstraction, and decontextualized vocabulary, resulting in low retention and limited real-world conversational ability. The target user specifically struggles with robotic repetition and lack of emotional/contextual relevance when trying to communicate with a Spanish-speaking family.

### Vision Statement
Create a mobile-first, visually immersive, conversation-driven Spanish learning experience where words become interactive elements inside meaningful scenes, enabling natural language acquisition through context, repetition, and emotional relevance.

### Core Value Proposition
- Learn Spanish through real-life scenarios instead of isolated drills
- Understand meaning through visual embodiment and interaction
- Build conversational confidence for family and daily life
- Use a mobile-native experience that feels like an app, not a website

### Target User
Primary:
- English-speaking adult learner
- Beginner to early-intermediate Spanish level
- Learning for real-life communication (partner/family)
- Primarily uses iPhone

Secondary:
- Parents who want shared learning with children
- Casual learners who prefer visual/contextual learning over structured grammar

### User Goals
- Understand common phrases used in family environments
- Respond naturally in simple conversations
- Build vocabulary tied to real-life context
- Recognize patterns in grammar without heavy memorization
- Gain confidence hearing and using Spanish in social settings

### Key Use Cases
- Greeting family members
- Being offered food or drink
- Talking about children
- Expressing needs (hungry, tired, etc.)
- Understanding simple household interactions
- Participating in casual conversation

### MVP Feature Set

#### Core Experience
- One interactive scene (Family House)
- Tap-based exploration of objects and characters
- Word embodiment visuals
- Dialogue interactions with selectable responses

#### Language Features
- 10–20 vocabulary items
- 8–12 conversation exchanges
- English translation support (toggle/reveal)
- Light grammar hints (pattern-based, not rule-heavy)
- Audio playback for words and phrases

#### Interaction Features
- Tap to reveal meaning
- Tap to play audio
- Choose conversational responses
- Immediate contextual feedback

#### System Features
- Local progress persistence
- PWA installability (manifest + service worker)
- Mobile-first responsive layout

### Out of Scope (MVP)
- Native mobile apps (iOS/Android)
- Speech recognition grading system
- Multiplayer/social features
- Large content library
- Complex authentication/account systems
- Advanced analytics dashboards

### Functional Requirements

#### Scene System
- Load and render a scene
- Register interactive elements (objects/characters)
- Trigger dialogue or vocabulary panels on tap

#### Dialogue System
- Present dialogue lines
- Display response options
- Evaluate response relevance (not just correctness)
- Provide explanation or hint

#### Vocabulary System
- Store words with metadata
- Display translation and usage
- Link words to scene elements

#### Audio System
- Play audio on user interaction
- Ensure compatibility with mobile tap requirements

#### Progress System
- Save user interactions locally
- Track seen/used words and phrases

#### PWA System
- Provide installable app experience
- Cache core assets
- Ensure offline shell functionality (basic)

### Non-Functional Requirements

#### Performance
- Fast initial load on mobile networks
- Smooth interaction response
- Minimal unnecessary re-renders

#### Usability
- Fully operable with one hand
- Clear UI hierarchy on small screens
- No dependency on keyboard input

#### Reliability
- Stable on iPhone Safari
- Consistent audio playback behavior
- No broken interaction states

#### Maintainability
- Clear separation between content and UI
- Modular component structure
- Easy to extend with new scenes/content

### Success Metrics (MVP)
- User can complete full scene without confusion
- User can understand at least 70% of phrases after interaction
- User reports improved confidence vs traditional apps
- No major usability issues on iPhone
- PWA install works and is usable from home screen

### Risks
- Over-engineering early UI
- Making visuals too childish for adult learners
- Performance issues on mobile
- Content not feeling authentic or natural
- Scope creep beyond MVP

### Mitigation Strategies
- Keep MVP intentionally small
- Prioritize usability over visual complexity
- Test frequently on mobile
- Use real conversational phrasing
- Enforce guardrails strictly

### Future Expansion (Post-MVP)
- Additional scenes (store, park, family events)
- Spaced repetition system
- Deeper grammar layers
- Voice interaction (optional, not primary)
- Personalized learning paths

---

## 3. Guardrails

### A. Product Guardrails (Non-Negotiable)
- The product is conversation-first, not drill-first.
- Real-life family Spanish takes priority over textbook Spanish.
- The experience must feel human, warm, and contextual—not robotic.
- The product must remain useful for an adult learner, even if visually playful.
- Learning should feel like participating in a world, not completing exercises.

### B. Learning Design Guardrails
- Do NOT lead with grammar rules; show patterns first.
- Do NOT require memorization before exposure.
- Do NOT force users to produce language too early.
- Always provide context before testing understanding.
- Prefer reuse of language in new contexts over repetition in isolation.
- Prioritize phrases people actually say in real life.
- Avoid unnatural or overly literal translations.

### C. UX / Interaction Guardrails
- Mobile-first ALWAYS wins over desktop convenience.
- No hover interactions—everything must work via touch.
- No small tap targets (minimum ~44px tap zones).
- No cluttered multi-panel layouts.
- No forced typing as part of the core experience.
- All key actions must be reachable with one hand.
- Bottom-sheet/drawer patterns preferred for interaction layers.
- Keep cognitive load low per screen.

### D. Visual Design Guardrails
- Visuals should support meaning, not distract from it.
- Avoid overly childish design that alienates adult users.
- Maintain clarity of text readability at all times.
- Animations should enhance learning, not slow interaction.
- Avoid excessive motion or heavy animation loops on mobile.

### E. Technical Guardrails
- Must remain fully functional as a PWA.
- No dependency on native iOS/Android tooling.
- Keep bundle size and asset weight minimal.
- Avoid unnecessary libraries and bloat.
- Separate content (data) from UI logic.
- Prefer simple, maintainable architecture over clever complexity.
- Do NOT rewrite stable working systems without explicit instruction.

### F. Performance Guardrails
- First meaningful paint must be fast on mobile.
- Interaction latency must feel instant.
- Audio playback must be responsive to taps.
- Avoid re-render loops and unnecessary state updates.
- Optimize assets (images/audio) for mobile bandwidth.

### G. Content Guardrails
- Avoid awkward, literal, or textbook-like phrasing.
- Ensure Spanish reflects real conversational tone.
- Keep English as support—not the dominant layer.
- Avoid overloading users with too many new concepts at once.
- Each scene should feel cohesive and meaningful.

### H. PWA Guardrails
- Must be installable to home screen.
- Must include manifest and service worker.
- Must function without full page reloads.
- Must handle offline shell gracefully (at minimum).
- Must respect mobile safe areas and viewport constraints.

### I. Codex Guardrails (Critical)
- Codex must treat documentation as source of truth.
- Codex must NOT invent features outside defined scope.
- Codex must NOT refactor working code unless explicitly instructed.
- Codex must follow mobile-first constraints strictly.
- Codex must return exactly what is requested (full file vs snippet).
- Codex must avoid introducing new dependencies unless justified.
- Codex must preserve existing behavior when adding features.

### J. Scope Control Guardrails
- MVP must remain intentionally small.
- Do NOT expand features mid-build without explicit approval.
- Do NOT add additional scenes before first scene is fully validated.
- Do NOT introduce backend complexity unless necessary.

### K. Quality Gate Guardrails
Before any feature is considered complete:
- Works on iPhone (primary test)
- Works with touch only
- No layout breakage on small screens
- Audio works reliably
- Interaction flow is intuitive
- No obvious performance issues

---

## 4. Foundation Spec

### A. High-Level Architecture
A mobile-first, client-rendered PWA with a clear separation between UI, content (data), and interaction engines.

**Layers**
1. UI Layer (React components)
2. Interaction Layer (scene + dialogue engines)
3. Data Layer (JSON-driven content)
4. Platform Layer (PWA: manifest + service worker + caching)

No backend required for MVP. All content is local/static.

---

### B. App Shell Structure (Mobile-First)

**Layout (portrait-first)**
- Header (minimal)
- Scene Area (top ~60%)
- Bottom Drawer (dialogue / interactions)
- Optional floating controls (audio, hints)

**Key Rule:** Bottom drawer is the primary interaction surface.

---

### C. Core Modules

#### 1. Scene Engine
Responsibilities:
- Load scene definition (JSON)
- Render interactive elements
- Handle tap interactions
- Trigger dialogue or vocab reveal

Scene JSON example:
```json
{
  "id": "family_house",
  "elements": [
    {"id": "casa", "type": "object", "position": "center"},
    {"id": "mama", "type": "character", "position": "left"}
  ]
}
```

#### 2. Dialogue Engine
Responsibilities:
- Load dialogue nodes
- Present lines and responses
- Handle branching
- Provide feedback/hints

Dialogue structure:
```json
{
  "id": "greeting_01",
  "line": "Hola, ¿cómo estás?",
  "responses": [
    {"text": "Muy bien", "correct": true},
    {"text": "Agua", "correct": false}
  ]
}
```

#### 3. Vocabulary Engine
Responsibilities:
- Map scene elements to vocabulary
- Provide translation, gender, examples
- Link to audio

#### 4. Audio Engine
Responsibilities:
- Handle tap-triggered playback
- Ensure mobile-safe playback (user gesture required)
- Provide reusable audio hooks

#### 5. Progress Store
Responsibilities:
- Track seen words
- Track completed dialogues
- Persist locally (localStorage or IndexedDB)

---

### D. Data Architecture

All learning content is JSON-driven and separated from UI.

**Core Data Types:**
- scenes
- vocabulary
- dialogues
- grammarHints

Example vocabulary schema:
```json
{
  "word": "casa",
  "article": "la",
  "gender": "feminine",
  "english": "house",
  "audio": "casa.mp3"
}
```

---

### E. Interaction Flow

**Primary Loop**
1. User enters scene
2. User taps element
3. Bottom drawer opens
4. Show Spanish + optional English
5. User plays audio
6. Dialogue triggered OR vocab revealed
7. User selects response
8. Feedback shown
9. Progress updated

---

### F. State Management

Keep simple for MVP.

State domains:
- currentScene
- activeDialogue
- selectedElement
- progress
- UI state (drawer open/closed)

Use lightweight state (React state or minimal store).

---

### G. PWA Architecture

#### Manifest
- name
- short_name
- icons
- display: standalone
- start_url

#### Service Worker
- Cache app shell
- Cache first scene assets
- Enable offline shell

#### Installability
- Must pass basic PWA install criteria
- Must work from home screen without browser UI

---

### H. Performance Strategy

- Lazy load scene data
- Compress audio
- Minimize bundle size
- Avoid unnecessary re-renders
- Keep animations lightweight

---

### I. Accessibility Basics

- Readable text sizes
- High contrast where possible
- Tap-friendly spacing
- Audio as optional support

---

### J. Extensibility Plan

System must support:
- Adding new scenes without UI rewrite
- Adding new dialogues easily
- Expanding vocabulary datasets
- Plugging in spaced repetition later

---

### K. Constraints

- Must work on iPhone Safari
- Must not depend on native APIs
- Must function as standalone PWA
- Must remain performant on mid-tier mobile devices

---

## 5. Repo Blueprint (Structure, Conventions, Boundaries)

### A. Goals
- Enforce clear separation of concerns (UI vs data vs engines)
- Optimize for mobile-first PWA
- Make it easy for Codex to add features without breaking structure
- Keep content editable without touching UI code
- Enable additive development (no rewrites)

---

### B. Top-Level Structure
```text
/spanish-visual-learning-pwa
  /public
  /src
  /docs
  /tests
  package.json
  README.md
```

---

### C. /public (Static Assets)
```text
/public
  /icons
  /audio
  /images
  manifest.json
  service-worker.js
  index.html
```

Rules:
- Only static, directly served assets
- Audio files referenced by data layer
- Keep assets compressed and mobile-friendly

---

### D. /src (Application Code)
```text
/src
  /app
  /components
  /features
  /data
  /lib
  /styles
  App.jsx
  main.jsx
```

---

### E. /src/app (App Shell + Routing)
```text
/src/app
  AppLayout.jsx
  Router.jsx
  providers.jsx
```

Responsibilities:
- Global layout
- App shell (header, scene container, drawer container)
- App-level providers (state, context)

---

### F. /src/components (Pure UI Components)
```text
/src/components
  SceneCanvas.jsx
  WordObject.jsx
  CharacterCard.jsx
  DialoguePanel.jsx
  ResponseChoices.jsx
  BottomDrawer.jsx
  AudioButton.jsx
  GrammarHint.jsx
```

Rules:
- No business logic
- Reusable, presentational components only
- Receive data via props

---

### G. /src/features (Feature Modules)
```text
/src/features
  /scene
    sceneEngine.js
    useScene.js
  /dialogue
    dialogueEngine.js
    useDialogue.js
  /vocabulary
    vocabEngine.js
  /progress
    progressStore.js
  /pwa
    registerServiceWorker.js
```

Rules:
- Contains logic/behavior
- Each feature encapsulates its own logic
- No UI rendering here

---

### H. /src/data (Content Layer)
```text
/src/data
  /scenes
    family-house.json
  /dialogues
    module1.json
  /vocabulary
    core.json
  /grammar
    hints.json
```

Rules:
- Pure JSON only
- No logic
- Easily editable/expandable
- Acts as single source of learning content

---

### I. /src/lib (Shared Utilities)
```text
/src/lib
  audio.js
  helpers.js
  constants.js
```

Responsibilities:
- Shared helper functions
- Utility logic used across features

---

### J. /src/styles
```text
/src/styles
  app.css
  variables.css
```

Rules:
- Centralized styling
- Mobile-first styling approach

---

### K. /docs (Source of Truth)
```text
/docs
  PRD.md
  FOUNDATION_SPEC.md
  GUARDRAILS.md
  REPO_BLUEPRINT.md
  CODEX_RULES.md
  ACCEPTANCE_CHECKLIST.md
```

Rules:
- Must always stay in sync with actual implementation
- Codex must treat this as authoritative

---

### L. Naming Conventions
- Components: PascalCase (SceneCanvas.jsx)
- Hooks: useX (useScene.js)
- Engines: camelCaseEngine (dialogueEngine.js)
- Data files: kebab-case (family-house.json)
- CSS: kebab-case classes

---

### M. Component Boundaries
- Components = UI only
- Features = logic only
- Data = content only

STRICT RULE:
- No mixing UI and data logic

---

### N. Data Flow Pattern
1. Scene loads JSON from /data
2. Scene engine processes it
3. UI renders via components
4. User interaction triggers feature logic
5. Progress saved via progress store

---

### O. Codex Interaction Rules (Repo-Specific)
- Must respect folder boundaries
- Must not move files unless explicitly instructed
- Must not refactor structure without approval
- Must add new features within existing structure
- Must return full files when requested

---

### P. Scaling Strategy
- Add new scenes via /data/scenes
- Add new dialogues via /data/dialogues
- Add new features via /features
- Keep UI reusable and minimal

---

## 6. Blueprint

### Phase 0 — Documentation First
- Finalize checklist
- Finalize PRD
- Finalize guardrails
- Finalize foundation spec
- Finalize repo structure
- Finalize Codex prompt rules

### Phase 1 — Scaffold
- Initialize repo
- Set up PWA-capable frontend
- Create mobile layout shell
- Add manifest/service worker basics
- Add local progress storage

### Phase 2 — First Scene Prototype
- Build one family-house scene
- Add tap targets
- Add dialogue drawer
- Add translation reveal
- Add audio buttons/hooks

### Phase 3 — Content Wiring
- Add vocabulary dataset
- Add first dialogue dataset
- Add grammar hint dataset
- Connect UI to content schema

### Phase 4 — Polish + QA
- Mobile usability pass
- iPhone installability pass
- Asset/performance pass
- Accessibility pass
- Regression checklist pass

### Phase 5 — Expansion
- Add more scenes
- Add spaced reinforcement
- Add richer progress system
- Add more nuanced conversation branching

---

## 7. Codex Rules / Prompting Standard

### A. Codex Role
Codex is the implementation assistant for this project. It is not the product strategist and it must not invent product direction. Its job is to implement against the approved project baseline.

### B. Source of Truth Hierarchy
Codex must treat the following as authoritative, in this order:
1. Current approved project docs in `/docs`
2. Current stable repo files
3. The exact user prompt for the current task

If there is any conflict, Codex must preserve the documented baseline unless explicitly instructed to change it.

### C. Non-Negotiable Project Rules
- Mobile-first PWA is mandatory.
- iPhone is the primary target device.
- Conversation-first learning is mandatory.
- Real family-life Spanish is prioritized over generic textbook content.
- UI, logic, and content must remain separated.
- Stable working behavior must not be casually rewritten.
- Additive changes are preferred over refactors.
- No native iOS/Android assumptions.
- No desktop-first UX decisions.
- No robotic drill-first learning mechanics added by default.

### D. Codex Operating Principles
- Read the current baseline before changing anything.
- Stay within the exact task scope.
- Preserve existing behavior unless explicitly approved to change it.
- Prefer the smallest correct change that satisfies the task.
- Do not make “helpful” unrelated improvements.
- When uncertain, preserve the baseline instead of guessing.

### E. Required Prompt Structure
Every serious Codex build prompt should follow this structure:

1. **CURRENT BASELINE**
   - State what is already approved and must be preserved.

2. **TASK**
   - State exactly what Codex should do.

3. **TARGET FILE(S)**
   - List the exact file path(s).

4. **DELIVERABLE FORMAT**
   - Specify whether to return:
     - full file(s)
     - snippet only
     - new file(s)
     - exact replace block(s)

5. **NON-NEGOTIABLE RULES**
   - List what must not change.

6. **ONLY ADD / ONLY CHANGE**
   - List the exact scope of allowed modification.

7. **OUTPUT REQUIREMENT**
   - State exact return format.

### F. Full-File vs Snippet Rule
- If asking Codex to create a new file, request the full file.
- If asking Codex to modify a small stable file section, request exact replace blocks.
- If asking Codex to revise a file with multiple interacting areas, request the full updated file.
- Never leave deliverable format ambiguous.
- If the file is currently unstable or repeatedly breaking, prefer a full-file return.

### G. No-Hallucination Rules
Codex must not:
- Invent files that do not exist unless explicitly asked to create them.
- Refer to components, classes, selectors, or functions not present in the provided baseline unless it is creating them intentionally within scope.
- Assume hidden architecture that has not been documented.
- Silently rename files, props, functions, classes, IDs, or folders.
- Fill in missing product decisions from its own imagination.
- Claim something exists in the repo unless it was explicitly provided or confirmed.

### H. No-Rewrite Rules
Codex must not:
- Refactor stable files unless explicitly told to.
- Reorganize folder structure unless explicitly told to.
- Simplify or rewrite working logic “for cleanliness.”
- Change semantics of existing behavior while adding new features.
- Replace the interaction model with a different pattern without approval.
- Swap technologies or core libraries without approval.

### I. File Handling Rules
- Respect the repo blueprint exactly.
- Put UI-only code in `/components`.
- Put logic-only code in `/features`.
- Put content-only JSON in `/data`.
- Put stable documentation in `/docs`.
- Put shared helpers in `/lib`.
- Do not mix content into component JSX unless explicitly temporary for bootstrapping.
- Do not move files unless the prompt explicitly authorizes it.

### J. Mobile / PWA Enforcement Rules
Any implementation must preserve:
- portrait-first usability
- touch-first interaction
- large tap targets
- bottom-drawer interaction pattern
- PWA installability
- iPhone Safari compatibility
- lightweight performance on mobile
- safe-area awareness on modern phones

Codex must not introduce:
- hover-only UI
- desktop-dependent controls
- keyboard-required core flows
- heavy animation systems without approval
- native-mobile-only features
- layout assumptions that break on narrow screens

### K. Dependency Rules
Codex must not add dependencies unless:
- they are clearly necessary
- they fit MVP scope
- they improve maintainability or PWA/mobile support
- the prompt explicitly allows new dependencies

If adding a dependency, Codex should briefly state:
- why it is needed
- what problem it solves
- why native/browser or existing project tools are insufficient

### L. Data and Content Rules
- Learning content must remain data-driven.
- Scene, vocabulary, grammar, and dialogue content should live in JSON unless explicitly directed otherwise.
- Do not hardcode lesson content into UI components unless explicitly requested for a prototype.
- Preserve schema consistency when expanding content files.
- Do not change data schema casually once content work has started.

### M. Return Format Rules
When asked for code, Codex must return exactly what was requested:
- single full file
- multiple full files
- exact replace block
- new JSON file
- patch instructions

No extra rewrites. No omitted required sections. No vague summaries instead of code.

### N. Validation / Handoff Expectations
When appropriate, Codex should also include:
- what changed
- what should still work unchanged
- what to test manually on iPhone/mobile/PWA flow
- any assumptions that were required

But it should not bury the actual code under excessive explanation.

### O. Preferred Prompt Style for This Project
Use direct, strict prompts with:
- exact file paths
- exact scope
- exact preserve list
- exact allowed additions
- exact output format

Avoid open-ended prompts like:
- “improve the app”
- “clean this up”
- “make it better”
- “refactor as needed”

### P. Standard Codex Prompt Template
```text
CURRENT BASELINE
- The current approved baseline is the repo + docs.
- Preserve all existing working behavior unless explicitly stated otherwise.
- This is a mobile-first PWA for iPhone-first use.

TASK
- [exact task]

TARGET FILE(S)
- [exact file path(s)]

DELIVERABLE FORMAT
- Return [single full file / full files / exact replace blocks only].

NON-NEGOTIABLE RULES
- Do not rewrite unrelated logic.
- Do not change stable behavior.
- Do not invent extra features.
- Keep mobile-first PWA behavior intact.
- Keep UI / logic / content separation intact.

ONLY ADD / ONLY CHANGE
- [exact allowed changes]

OUTPUT REQUIREMENT
- Return only [requested format].
```

### Q. Session Start Pack for Fresh Codex Sessions
Whenever starting a fresh Codex session, provide:
- project purpose
- current phase
- approved docs summary
- repo blueprint summary
- non-negotiable rules
- exact requested task
- exact deliverable format

This prevents drift across sessions.

### R. Review Gate Before Accepting Codex Output
Before using Codex output, verify:
- Did it change only what was requested?
- Did it preserve stable behavior?
- Did it keep mobile-first/PWA constraints intact?
- Did it respect file boundaries?
- Did it return the correct format?
- Did it invent anything not present in the baseline?

## 8. Milestone Acceptance Checklist

This checklist defines **objective pass/fail criteria** for each phase. A milestone is NOT complete unless all required checks pass.

---

### Phase 1 — Repo Scaffold Acceptance

**Structure**
- Correct top-level folders exist (/public, /src, /docs, /tests)
- /src follows blueprint (app, components, features, data, lib, styles)
- /docs contains all baseline documents

**Build System**
- App runs locally without errors
- Dev server starts cleanly
- No console errors on load

**PWA Basics**
- manifest.json exists and is valid
- service worker file exists (even if minimal)
- App loads with proper viewport/meta tags

**Pass Condition:** Project runs locally with correct structure and no blocking errors

---

### Phase 2 — Mobile App Shell Acceptance

**Layout**
- Portrait-first layout renders correctly on mobile width
- Scene area and bottom drawer both visible and usable
- No horizontal scrolling required

**Interaction**
- Bottom drawer opens/closes reliably
- Tap targets are easily usable with thumb
- No hover dependencies exist

**Responsiveness**
- Works at common mobile widths (320px–430px)
- No layout breakage or overlapping UI

**Pass Condition:** App feels usable and stable on iPhone-sized screen

---

### Phase 3 — Scene Engine Acceptance

**Rendering**
- Scene loads from JSON
- Elements appear in expected positions

**Interaction**
- Tapping elements triggers expected behavior
- No dead/unresponsive elements

**State Handling**
- Selected element state updates correctly
- No UI flicker or reset bugs

**Pass Condition:** User can interact with scene elements reliably

---

### Phase 4 — Dialogue System Acceptance

**Display**
- Dialogue appears in bottom drawer
- Spanish text clearly readable

**Interaction**
- Response choices are selectable
- Selection updates dialogue state correctly

**Logic**
- Correct vs incorrect responses handled appropriately
- Feedback or hints displayed when needed

**Pass Condition:** User can complete at least one full dialogue flow without issues

---

### Phase 5 — Vocabulary + Audio Acceptance

**Vocabulary**
- Tap reveals Spanish + English meaning
- Gender/article displayed correctly

**Audio**
- Audio plays on tap (no autoplay issues)
- Works consistently on iPhone Safari

**Clarity**
- No confusion between word, translation, and usage

**Pass Condition:** User can hear and understand words through interaction

---

### Phase 6 — Progress Persistence Acceptance

**Tracking**
- Seen words are recorded
- Dialogue progress is stored

**Persistence**
- Data persists after refresh
- No data loss during normal use

**Pass Condition:** Progress survives reload and continues correctly

---

### Phase 7 — PWA Installability Acceptance

**Install Flow**
- App can be added to home screen on iPhone
- Icon and name display correctly

**Standalone Behavior**
- App launches without browser UI
- Navigation works inside standalone mode

**Offline Shell (Basic)**
- App loads basic shell without network (if implemented)

**Pass Condition:** App behaves like a lightweight mobile app when installed

---

### Phase 8 — Mobile UX Quality Gate

**Usability**
- All actions reachable with one hand
- No accidental taps due to tight spacing

**Performance**
- No noticeable lag on interactions
- No stuttering animations

**Clarity**
- User always understands what to do next

**Pass Condition:** App feels smooth, intuitive, and frustration-free on iPhone

---

### Phase 9 — Content Quality Acceptance

**Language Quality**
- Spanish phrases sound natural
- No awkward or literal translations

**Relevance**
- Content reflects real family-life scenarios

**Learning Flow**
- User sees patterns, not just isolated facts

**Pass Condition:** Content feels useful in real conversation

---

### Phase 10 — Final MVP Acceptance

**Core Experience**
- User can complete full scene end-to-end
- User understands majority of interactions

**Technical Stability**
- No critical bugs
- No broken flows

**Platform Fit**
- Works smoothly as PWA on iPhone

**Product Goal Alignment**
- Feels different (and better) than drill-based apps
- Supports real conversational learning

**Pass Condition:** MVP delivers on core promise without major friction

---

### Final Release Gate (Go / No-Go)

All of the following must be TRUE:
- All phase acceptance checks passed
- No critical mobile usability issues
- No blocking bugs
- PWA install works correctly
- First-time user can understand and complete experience

If any are false → DO NOT ADVANCE

---

### 9. Next Steps
1. Draft Module 1 Content Spec
2. Create initial Codex scaffold prompt
3. Initialize repo locally
4. Begin Phase 1 implementation

