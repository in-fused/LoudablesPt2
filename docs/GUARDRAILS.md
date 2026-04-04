# GUARDRAILS

- Keep architecture stable; avoid casual restructuring.
- Maintain separation:
  - UI in `/src/components` and `/src/app`
  - logic in `/src/features` and `/src/lib`
  - content in `/src/data`
- Keep scope restricted to approved phase goals.
- Do not assume native mobile APIs.
- Do not add backend/auth/speech/analytics without explicit approval.
- Do not replace the scene + bottom drawer model.
- Prefer additive changes and reversible edits.
