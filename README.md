# Loudables

Loudables is a mobile-first, scene-based language learning system designed to teach Spanish through **interactive context, dialogue, and guided exploration**.

Instead of memorization or robotic repetition, Loudables focuses on **real-world comprehension**, using visual scenes, conversational patterns, and structured progression.

---

## 🎯 Core Concept

Each scene represents a real-life environment (e.g. home, kitchen).

Users:
- tap items in the scene
- see contextual Spanish vocabulary
- explore dialogue tied to that item
- complete response-based exercises
- build understanding through interaction

---

## 🧠 Learning Philosophy

- **Conversation-first**, not translation-first  
- **Context over memorization**  
- **Guided exploration**, not rigid lessons  
- **Mobile-native experience**  

---

## 🏗 Current Features

### Scene System
- Multiple scenes supported (e.g. `family-house`, `kitchen-basic`)
- Scene registry-driven architecture
- Scene-specific vocabulary and dialogue

### Vocabulary + Dialogue
- Scene-owned vocabulary sets
- Scene-specific dialogue files
- Grammar hints tied to real usage

### Interactive Learning
- Tap-based item exploration
- Response exercises with feedback
- Persistent progress tracking

### Progress System
- Per-scene progress isolation
- Seen / completed tracking
- Scene-specific reset
- Completion state detection

### Guided Flow
- Recommended next item logic
- Subtle progression guidance
- Free exploration preserved

### Audio Foundation
- Scene-aware audio targets
- Dialogue line audio support (data-driven)
- Graceful fallback when audio is missing

### Mobile UX
- Touch-first layout
- Bottom drawer interaction model
- Designed for PWA deployment

---

## 🧱 Architecture Overview

```text
src/
  app/
  components/
  features/
    scene/
    dialogue/
    progress/
  data/
    scenes/
    dialogues/
    vocabulary/