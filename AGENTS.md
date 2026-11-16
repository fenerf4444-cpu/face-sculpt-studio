# Architecture
- Keep the existing camera and training flows behind the wellness presentation so visual updates do not change exercise evaluation.
- Use browser-provided Turkish speech only when a Turkish voice is available; avoid incorrect-language fallback and overlapping cues.
- Route Learn exercises and personalized sessions into PlayScreen's existing calibrated trainer so all entry points share the same exercise evaluation.
- Generate personalized sessions only in a server-side Cloud function; allow only catalog exercise IDs, enforce session timing in code, and never send camera images or landmarks to the AI gateway.
- Keep camera video in a dedicated unobstructed viewport and render text and controls outside it; retain the media stream across phase-specific video elements.
