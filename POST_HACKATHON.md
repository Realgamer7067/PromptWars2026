# Post-hackathon: shortcuts and production gaps

Things deliberately simplified to fit the build budget. Not bugs — labeled here so they aren't mistaken for finished production behavior.

- **HACKATHON SHORTCUT:** No auth, no per-user accounts. Recent packs are stored in the browser's `localStorage`, capped at 5 packs / ~2MB, and are only visible on the device/browser that generated them. Replace with real accounts + a database before any multi-user deployment.
- **HACKATHON SHORTCUT:** Rate limiting and the provider-call cap are in-memory (`server/index.js`), reset on every process restart, and keyed by `req.ip` without proxy-aware IP handling. Fine for a single-instance demo; replace with a real rate limiter (e.g. Redis-backed) and a spending cap enforced on the provider side before public traffic.
- **HACKATHON SHORTCUT:** Text-only PDF extraction (`pdfjs-dist` in the browser). Scanned/image-only PDFs, DOCX, and slide formats are explicitly rejected, not supported — no OCR was attempted; that's a real project on its own.
- **Known limitation, not a shortcut:** Citation checking proves a quote exists verbatim on its declared page — it does not prove the generated claim logically follows from that quote, or that an answer key is factually correct. The source drawer makes that easy for a human to verify; the app does not claim to verify it automatically.
- **Known limitation:** Text extraction from columns, tables, and dense slide layouts can be poor. A page with usable-looking extracted text may still miss diagram content the lecture relies on.
- One repair attempt is allowed per generation (see `server/index.js`); if the model still fails to produce fully-grounded content on the second attempt, the user gets an explicit failure message and a retry action rather than a partially-complete pack.

## Before any real deployment

1. Move recent-pack storage server-side, behind real auth.
2. Replace in-memory rate limiting with a durable, IP-proxy-aware limiter.
3. Add structured logging/monitoring around provider errors and cost.
4. Add automated tests beyond `tests/studyPack.test.js` (UI, extraction edge cases).
5. Revisit the PDF page-count/char limits (`shared/studyPack.js` `LIMITS`) for real lecture sizes.
