# StudyForge

Turn one lecture PDF into concise revision notes and a five-question practice set — and when you miss a question, jump straight to the note and source passage that explains it.

Every note bullet and quiz question carries a citation: a physical PDF page number and a verbatim quote. The app independently checks that quote actually occurs on the declared page before it's shown as trustworthy evidence — grounding, not just a claim.

## How it works

1. Upload a text-based lecture PDF (or try the bundled sample).
2. The browser extracts text page-by-page with `pdf.js`.
3. The server sends the page text to Claude, which returns 3-5 concepts (with cited bullets) and exactly 5 quiz questions (each with a cited correct answer).
4. The server independently verifies every citation against the extracted page text before returning the pack — a citation that can't be located is labelled honestly, never hidden.
5. Answer the quiz; miss a question and **Revisit** opens the relevant note alongside its source passage.
6. Export the whole pack as Markdown.

## Stack

React + Vite (client) · Express (server) · Anthropic API (Claude) · `pdf.js` for client-side PDF text extraction. No database — recent packs are cached in the browser's `localStorage`.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Anthropic key (see below)
npm run dev            # runs the Vite dev server + the API server together
```

Open http://localhost:5173.

### Environment variables (`.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | From [console.anthropic.com](https://console.anthropic.com) |
| `ANTHROPIC_WORKSPACE_ID` | only if your key isn't workspace-scoped | Anthropic returns a clear 400 error telling you if you need this |
| `LLM_MODEL` | no | Defaults to `claude-sonnet-5` |
| `PORT` | no | Defaults to `5174` (API server) |

`.env` is gitignored — never commit real keys.

## Production build

```bash
npm run build   # builds the client into dist/
npm start       # serves dist/ + the API from one Express process
```

## Docker

```bash
docker compose up --build
```

Reads the same `.env` file via `env_file` in `docker-compose.yml`; the key is never baked into the image.

## Tests

```bash
npm test    # focused checks on citation matching and pack validation (shared/studyPack.js)
```

## Project layout

```
server/index.js         Express API: prompt, Claude call, citation validation, static serving
shared/studyPack.js      Contract + validation + quote-matching, shared by client and server
src/lib/pdf.js           Client-side PDF text extraction
src/components/          UI: upload, notes, quiz, source drawer, library panel
public/sample-lecture.pdf   Bundled sample used by "Try a sample lecture"
```

See `POST_HACKATHON.md` for known shortcuts/limitations (no auth, in-memory rate limiting, text-only PDFs — no OCR).
