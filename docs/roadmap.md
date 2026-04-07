PROJECT: Loudables (Mobile-first Spanish Learning PWA)

CURRENT MAIN is the baseline.

----------------------------------------
CORE ARCHITECTURE (LOCKED)
----------------------------------------

- Scene-based learning system (family-house, kitchen-basic)
- JSON-driven content (scenes, dialogue, responses, grammar)
- BottomDrawer = primary interaction surface
- ResponseChoices = response engine
- Centralized audio system (src/lib/audio.js)
- OpenSLR Puerto Rican dataset (source_assets, curated into public/audio)

DO NOT:
- Rewrite architecture
- Replace JSON structure
- Introduce backend
- Replace audio system
- Break existing scene/step flow

----------------------------------------
PHASE PROGRESSION (STRICT ORDER)
----------------------------------------

Phase 31 ✅
- Curated Puerto Rican audio subset integrated

Phase 32 ✅
- Hybrid UX polish (feedback, responsiveness, engagement)

Phase 33 (CURRENT – IN PROGRESS)
- Audio + conversation flow cohesion
- Ensure tap → hear → respond → continue feels natural
- Prevent double-triggering audio
- Tighten timing and transitions

Phase 34 (NEXT)
- Audio-first interaction layer
- Auto-play dialogue lines
- Optional repeat / replay UX
- Begin “listen before reading” behavior

Phase 35
- True conversation chaining
- Multi-step memory across dialogue
- Responses influence next lines

Phase 36
- Smart guidance layer
- Highlight recommended next actions
- Adaptive progression hints

Phase 37+
- Gamification layer (streak psychology, reinforcement loops)
- Expanded audio coverage
- Additional scenes/modules

----------------------------------------
NON-NEGOTIABLE DEVELOPMENT RULES
----------------------------------------

- Always anchor to provided files
- Never hallucinate missing code
- Only modify explicitly allowed files
- Preserve ALL existing behavior unless explicitly told otherwise
- Prefer additive changes over rewrites
- No silent refactors
- No structural changes without approval

----------------------------------------
AUDIO SYSTEM RULES
----------------------------------------

- Raw dataset in _source_assets must NEVER be modified
- Only curated copies live in public/audio
- audio.js remains the single source of truth for playback
- No TTS integration unless explicitly approved later

----------------------------------------
UX PHILOSOPHY (CRITICAL)
----------------------------------------

Target experience = Hybrid

- Feels like a real conversation
- BUT has subtle gamification (feedback, momentum, reinforcement)

DO NOT:
- Turn into Duolingo clone
- Add points, coins, clutter
- Break immersion

DO:
- Improve flow
- Improve feedback
- Improve emotional engagement

----------------------------------------
SUCCESS CRITERIA (GLOBAL)
----------------------------------------

- No regressions
- Smooth mobile experience (iOS priority)
- Audio always works reliably
- Interaction feels fast and responsive
- App feels progressively more “alive” each phase

----------------------------------------
CURRENT TASK CONTEXT
----------------------------------------

Phase 33 is in progress but NOT yet committed.

Before committing:
- Verify no regressions
- Verify audio does not double trigger
- Verify timing feels natural
- Ensure no hidden rewrites occurred

----------------------------------------