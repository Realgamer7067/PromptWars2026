# StudyForge frontend remake

## 1. Outcome and boundaries

Rebuild the presentation around a compact, modern study workspace: an obvious upload action, readable revision notes, focused practice, and source evidence that stays beside the content it explains.

**Design direction:** crisp light surfaces, strong sans-serif typography, graphite text, one cobalt action color, and yellow used specifically for source highlights. The product content supplies the visual interest.

This plan covers the complete frontend, including upload, processing, library, notes, practice, results, and source inspection. Keep the existing React/Vite stack, API, generation logic, PDF extraction, response contract, and Markdown export. Small frontend state changes are included where necessary to make navigation and evidence inspection work correctly.

The user reports that the backend and overall flow work. The audit below is based on the supplied screenshot and current source files; it is not a new runtime verification of every screen. The sample passage in section 5 was checked against the actual bundled PDF.

This document supersedes the visual implementation guidance in `PLAN.md`. The earlier 2.5-hour budget was for the project; do not assume another 2.5 hours remain. The implementation schedule below is an estimate to adapt to the actual clock.

## 2. What is wrong with the current interface

| Finding | Evidence | Redesign decision |
| --- | --- | --- |
| The entry screen spends most of its attention on a large headline and dark backdrop. | Screenshot; `src/hero.css:26` and `src/components/UploadPanel.jsx:128`. | Put a compact introduction and upload controls near the top, aligned to the working area. |
| The dark hero, pale sidebar, dotted floor, and floating white form feel like separate designs. | Screenshot; hero gradients, shell dot pattern, and negative panel margin. | One consistent light theme across the application. |
| The main form is small relative to the canvas and visually detached by a heavy shadow. | `src/hero.css:152` and `:161`. | Give upload a substantial area within the page grid; remove the negative overlap and oversized shadow. |
| A mostly empty 232px sidebar permanently consumes space. | Screenshot; `src/styles.css:249`. | Put Study packs behind an explicit header control; use a contextual concept outline while reading. |
| Long pack titles are truncated while there is plenty of unused space elsewhere. | `src/styles.css:335`. | Use two-line titles in the library panel and a readable active-document title. |
| Serif display type, small muted labels, gradients, and multiple accent colors weaken hierarchy. | `src/styles.css:10`; font imports in `index.html`. | Use the existing Public Sans family consistently, clear type sizes, and one action color. |
| The source view dims and blurs the note it is supposed to explain. | `src/styles.css:866`; `src/product.css:130`. | On wide screens, dock evidence beside the note without a backdrop. |
| Results render internal concept IDs. | `src/components/QuizPlayer.jsx:203`. | Resolve IDs through `pack.concepts` and display actual concept titles. |
| There is no rendered Back to notes action despite an existing reducer action. | `src/App.jsx:63` and the props passed to `QuizPlayer`. | Add persistent Notes/Practice navigation that preserves the attempt. |
| Revisit scrolls to a note but does not open the relevant source. | `src/App.jsx:99` and `:281`. | Link the missed concept to an existing missed question citation, then focus the note and reveal that evidence. |
| The loading UI includes a checking stage the app never dispatches. | `UploadPanel.jsx:5`; `App.jsx:23`, `:43`, `:45`. | Reflect the two real asynchronous phases available through the existing API. |
| Mobile hides the library with no replacement. | `src/styles.css:978`. | Keep the Study packs trigger and New action accessible at every width. |
| Modal semantics are declared without focus containment or restoration. | `SourceDrawer.jsx:25` and `:67`. | Implement distinct accessible docked and modal presentations. |
| Styling is spread across 1,468 lines in four files, including an older unused upload layout and a separate polish layer. | `styles.css`, `hero.css`, `product.css`, `index.css`. | Replace retired rules as components migrate; establish one predictable stylesheet ownership model. |

The screenshot also has a warm glow at the outer frame and a cursor effect. Their origin is not established in the inspected application styles. Check a clean browser capture before treating these as app defects.

## 3. Design rules that guide the remake

1. **The first useful action wins.** Upload controls must be visible without scrolling at 1366×768. No full-height hero, duplicated logo, proof strip, or ornamental backdrop.
2. **Content stays legible.** Use a reading column, substantial body type, concise metadata, and clear headings. Dense lecture content should not become a collection of tiny cards.
3. **Evidence stays connected.** A source click makes the passage and originating note/question visible together on a laptop.
4. **Navigation is persistent and small.** One app header; library when requested; local Notes/Practice navigation for an active pack.
5. **Every visual signal means something.** Cobalt indicates an action or selection, yellow marks source text, and green/red appear only for answer outcomes.
6. **Keep the working product intact.** Build from the current components and state. Do not introduce routing, a UI framework, a new backend, or a second data store.

Design calibration: moderate layout variation, restrained motion, and comfortable product density. For the taste-skill vocabulary: `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 3`, `VISUAL_DENSITY: 5`. Marketing-page techniques apply only to the small entry composition; the study flow uses product interaction patterns.

## 4. App shell and information architecture

### Persistent header

- Height: 64px desktop, 56px mobile, with a subtle bottom divider.
- Left: existing StudyForge mark at 26px and the name in Public Sans semibold. Preserve brand identity; remove the duplicate oversized mark from the upload area.
- Right: **Study packs** and **+ New** using the existing library/new actions. No profile avatar, settings menu, search box, or inactive navigation.
- Show the active document context beneath the header, where it has room to wrap, rather than squeezing it between header buttons.
- On mobile, retain text labels where they fit. Any icon-only control needs an accessible name and a comfortable hit area.

### Study packs panel

Reuse the pack list and callbacks in `Sidebar.jsx`, but present it as a header-triggered library panel rather than a permanent rail.

Show title, filename, and an available creation date. Titles may use two lines; expose the full filename through selectable text or a details line, not only hover. Distinguish the active pack with a tinted row and current-state semantics.

Include the existing empty-state message. Label persistence **Saved on this browser**. Do not add progress badges or promise resumed answers across reload: current code saves the generated entry, but does not continually persist attempts. Preserve in-session answers when switching Notes/Practice.

Use the same modal behavior as the narrow-screen source panel, with one overlay open at a time. No library search is needed for a five-pack limit. Library deletion is outside the essential visual remake.

### Active-pack navigation

Below the pack title and metadata, provide **Notes** and **Practice** controls; Download sits in the same header region as a secondary action. Practice can carry the actual question count from `pack.quiz.length`.

Keep Notes/Practice as simple view buttons with a clear current state if that is fastest. If implemented as ARIA tabs, implement the complete keyboard and panel relationships rather than adding tab roles to ordinary buttons. [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

## 5. Entry screen: upload with a visible outcome

Replace the current centered dark hero with this desktop composition:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [mark] StudyForge                                  Study packs   + New   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Your lecture, ready to revise.                                            │
│ Upload a PDF for revision notes, practice, and source passages.            │
│                                                                          │
│ ┌───────────────────────────────────┐  Example from sample lecture        │
│ │                                   │  ┌───────────────────────────────┐ │
│ │     Drop your lecture PDF         │  │ Database Transactions         │ │
│ │         Choose PDF                │  │                               │ │
│ │                                   │  │ Durability                    │ │
│ │     Text-based PDF · up to 10 MB   │  │ Committed changes survive     │ │
│ └───────────────────────────────────┘  │ a database crash.             │ │
│ Subject style   [ General        v ]  │                               │ │
│ [ Create study pack               ]  │ Source passage · PDF p. 5      │ │
│ Try a sample lecture                 │ [highlighted source excerpt]  │ │
│                                      └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dimensions and hierarchy

- Content width up to 1120px, centered within the application; desktop outer padding 32px and top spacing 40px.
- Left column approximately 560px, right approximately 400px, with a 48px gap. Let Grid distribute remaining space rather than hard-coding overflow-prone totals.
- Entry heading 38px/1.15, maximum two lines. Supporting line 16px/1.5 and under 20 words.
- Dropzone approximately 190px tall with a quiet tinted fill and a thin boundary. The entire area accepts drops; Choose PDF is a real keyboard-operable file-picker trigger.
- Subject style remains a labelled native select, restyled with the same control tokens. Preserve its existing values and ordering.
- Create study pack is the dominant action after selection. Try a sample lecture becomes a quieter text-style button below it.
- Keep essential file limits visible. Import the existing limits rather than maintaining contradictory numbers in UI copy.

### Selected-file state

Display the actual filename, readable file size from `state.file.size`, and a Change file action inside the same dropzone footprint. Keep the selected subject. Enable Create study pack only for a selected file and disable all replacement/drop/sample paths while busy.

Do not invent a page count before extraction. Long filenames wrap or truncate with access to their full value. Use text to explain the disabled generation action rather than relying on a washed-out button alone.

### Example preview

This is a small, clearly labelled example of the output, not a second functioning study pack or a simulated live result. Use real sample content:

- Heading: **Durability**.
- Authored note: **Committed changes survive a database crash.**
- Source excerpt from the actual `public/sample-lecture.pdf`, physical page 5: **“once a transaction has been committed, its effects survive any subsequent crash, power loss, or restart of the database system.”**

Keep it static and noninteractive; do not draw fake tabs or buttons. The existing Try a sample lecture action must still fetch the real sample PDF and run the actual pipeline. The earlier idea document's page-4 illustration was hypothetical; this bundled PDF puts durability on page 5.

Build this preview after the core screen layouts. If time is tight, omit it and center the bounded upload workspace rather than leaving an empty column or shipping a decorative fake screenshot.

## 6. Processing and error states

Use the same upload area while processing so the selected filename and context stay visible. Replace its action area with a compact progress block.

| Actual state | Display |
| --- | --- |
| `reading` | **Reading your PDF** with an indeterminate status indicator. |
| `generating` | **Creating notes and checking sources**. Reading is complete; generation remains indeterminate. |
| Successful response | Transition directly to the actual notes. |
| `error` | Inline error message, selected file retained, Retry or Change file as appropriate. |

The current extraction helper does not stream page progress, and the endpoint performs generation and citation checks inside one response. Do not animate three timed success stages, invent a checking event, add SSE, or display a made-up percentage.

Use `aria-live="polite"` for status changes and the existing alert semantics for errors. An optional elapsed timer may show real time, but no estimate is needed. Progress must remain understandable with motion disabled.

Preserve the meaning of service errors and document limitations. Omitted-page information already exists in state; display it unobtrusively on the resulting pack rather than silently implying all visual material was read.

## 7. Notes: a designed reading workspace

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [mark] StudyForge                                  Study packs   + New   │
├──────────────────────────────────────────────────────────────────────────┤
│ Database Transactions                              Download study pack  │
│ sample-lecture.pdf · 5 concepts · 5 questions                              │
│ Notes     Practice                                                       │
├──────────────────┬────────────────────────────────┬──────────────────────┤
│ In this lecture  │ Durability                     │ Source passage    [x]│
│                  │                                │                      │
│ Transactions     │ Committed changes survive      │ sample-lecture.pdf   │
│ Atomicity        │ a database crash.  [PDF p. 5]   │ PDF p. 5             │
│ Consistency      │                                │ Passage located      │
│ Isolation        │ Further revision bullets...    │                      │
│ Durability       │                                │ Extracted page text  │
│                  │                                │ ...[highlight]...    │
└──────────────────┴────────────────────────────────┴──────────────────────┘
```

This wireframe illustrates available regions, not an instruction to fabricate five particular generated concepts. Render the actual pack data.

- Use a readable main column, approximately 640-720px, with 16px body text and 1.65 line height.
- Title 30px; concept headings 21px; metadata 13-14px with sufficient contrast.
- Put filename, concept count, and question count beneath the title. The current API's `pageCount` counts included text pages, so avoid presenting it as the original total PDF page count.
- Keep note sections flat, separated by 24-32px spacing and occasional dividers. Avoid a shadowed card around every concept or bullet.
- Make citation controls compact: **PDF p. 5** visually, with an accessible label such as **View source for Durability, PDF page 5**. Show the currently inspected citation as selected.
- At wide widths, show a small In this lecture outline derived from `pack.concepts`. Clicking focuses `concept-${id}`. A full scrollspy is optional.
- Keep Practice reachable from the pack header; do not require scrolling through all notes to find it.
- A Revisit target receives a brief, restrained background emphasis and real keyboard focus. Preserve the existing concept anchor IDs.

## 8. Source panel: the signature interaction

### Wide screens

At 1100px and wider, open a 360-400px docked panel in the content grid. Keep the originating text visible and interactive. Remove the whole-screen dimming and blur.

Use a labelled `aside` or nonmodal region, not `aria-modal="true"`. It has a header, close action, document name, physical page number, **Passage located**, **Extracted page text**, and the original text with the existing match range highlighted.

Scroll the matched `<mark>` into view inside the panel after render. Do not scroll the entire app to the top. Keep highlight fill visible without waiting for an animation; a short fade is sufficient.

### Narrow screens

Below 1100px, use an overlay panel. On phones it occupies the available viewport with a sticky header and its own text scroll area. The close control stays visible and the background is inert while modal.

Move focus into the panel on open, contain Tab/Shift+Tab in modal mode, close on Escape, and return focus to the invoking control. A docked panel must not trap focus. Prefer the native dialog mechanism for modal behavior, styled to match; verify transitions between modal and docked modes while open. [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### Data constraints

Use the existing citation fields: `status`, `pageNumber`, `quote`, `pageText`, `matchStart`, and `matchEnd`. Preserve text as escaped React content. Do not alter normalization, create a new source verifier, or claim the extracted text is a rendered PDF page.

Guard the view against invalid bounds before slicing. If a restored citation lacks valid page text or match data, present the available quote with a clear limitation; do not display a located highlight that was not established.

## 9. Practice and results

### Practice

- Retain the active pack header and a Back to notes path that preserves the attempt.
- Use **Question 2 of 5**, a clear question heading, and four full-width option rows with A/B/C/D markers.
- Give every option the same minimum height, padding, and alignment. Longer content expands naturally.
- Preserve answer selection and submit semantics. Existing option buttons can retain `aria-pressed`; native radio inputs are also suitable, but do not add incomplete custom radio roles.
- Before submission, cobalt denotes selection. After submission, use text labels **Correct answer** and **Your answer**, plus green/red styling. Color and decorative icons must not be the only feedback.
- Reveal the existing explanation and source action after submission. Hide stale notes/source content before the next unanswered question.
- After question five, label the action **See results** rather than another ambiguous Next.
- Keep controls in normal flow; avoid a fixed bottom action covering explanations on a small laptop or phone.

### Results

Use **3/5 this attempt** as the main outcome, then a short actionable list. Replace raw concept IDs with titles via a map of `pack.concepts`. Each row shows the title and **Revisit**. Deduplicate by concept ID, preserving the existing score calculation.

For each missed concept, derive a representative wrong question from `pack.quiz` and `attempt.answersByQuestionId`. Its existing citation is the evidence to open when revisiting. Prefer that citation over an arbitrary first note citation.

Include Back to notes and Retry practice. Retrying resets the attempt as today; switching views does not. For a perfect attempt, show the existing completion message without an empty missed-concepts list. Avoid mastery rings, grade predictions, confetti, or invented accuracy scores.

## 10. Small frontend behavior fixes required by the design

These support the remake and do not require a backend change:

1. **Wire Back to notes.** Use the existing `BACK_TO_NOTES` action and supply callbacks to the pack header/practice view.
2. **Resolve display titles.** Pass `concepts` or a derived concept map into the results presentation; keep IDs as stable internal keys.
3. **Complete Revisit.** Dispatch the target concept and an existing missed-question citation together. Focus the concept after Notes renders. Repeated clicks on the same concept must still focus it.
4. **Clear stale source state.** Close the source panel on New, pack change, generation success, Retry, and advancing to a new unanswered question. A citation from the old pack must never appear under a new filename.
5. **Handle pending work on navigation.** The existing request ID changes only when another generation starts. Invalidate it on New/pack change and abort the request where possible through the already-supported `signal` parameter. Keep late extraction/provider results from replacing the newly chosen view. Do not promise that client cancellation stops billing.
6. **Guard busy upload paths.** The existing drop handler can still accept a file while its input is disabled. Add the same busy guard to file/drop/sample actions and protect the brief sample-fetch interval against duplicate clicks.
7. **Manage panel/focus state.** Keep library openness, responsive presentation, and source trigger refs in UI state. Do not copy the pack or attempt into a new store.
8. **Respect reduced motion when revisiting.** The current `scrollIntoView({ behavior: 'smooth' })` is explicit JavaScript; choose instant/auto behavior when reduced motion is requested.

## 11. Concrete design tokens

| Token | Target |
| --- | --- |
| App background | `#F6F7F9`. |
| Main surface | `#FFFFFF`. |
| Quiet surface | `#EEF1F5`. |
| Main text | `#20232A`. |
| Secondary text | `#626975`; do not lower opacity for meaningful labels. |
| Accent / hover | `#345BD6` / `#294AB8`. |
| Accent tint | `#EDF1FE`. |
| Divider | `#DDE1E8`; for separation, not as the only control boundary. |
| Interactive boundary | `#7B8492` where the boundary is needed to identify a control. |
| Source highlight | `#FFF0AD` with `#20232A` text. |
| Correct | `#246B48` on `#EAF5EE`. |
| Incorrect | `#A63832` on `#FCEEEE`. |
| Font | Existing Public Sans, weights 400/500/600/700; system fallback. |
| Type scale | 38px entry / 30px pack / 24-28px question / 21px concept / 16px body / 13-14px metadata. |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48px. |
| Radius | 8px controls, 12px major panels; avoid pills for every label. |
| Controls | 44px minimum height for main controls; 44px close/menu hit areas. |
| Shadow | A restrained tinted shadow for overlays only; upload/notes need no heavy lift. |
| Layers | Base 0, sticky header 10, backdrop 20, modal 30. |

Calculated flat-color contrast: secondary text on white is approximately 5.53:1; white on the accent is 5.81:1; primary text on the app background is 14.67:1. Standard body text should reach at least 4.5:1. These calculations do not replace checking actual disabled, hovered, and layered states. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Use the existing font family throughout before considering font changes. Remove the unused serif request after all display rules migrate. Locally hosting the same font is optional; changing fonts or adding dependencies must not delay the core redesign.

Reuse the existing source/check/file glyphs through a small shared component, with consistent dimensions and stroke weight. Do not add an icon library for this pass or use the unrelated social icons in `public/icons.svg` as product controls.

## 12. Responsive and motion specification

| Width | Layout |
| --- | --- |
| 1440px and above | Centered content up to 1280px. Reading may show outline, main column, and source together. |
| 1100-1439px | Upload can use two columns. Hide the outline when source opens, preserving a readable main column beside the docked source. |
| 768-1099px | Upload and example stack. Notes use one reading column; source and library use overlays. |
| Below 768px | 16px gutters, 56px header, full-width controls, wrapping titles. Source/library use full-width modal panels. |

Use `min-height: 100dvh` for the shell. Keep a single main document scroll; only library/source content gets a separate scroll region when needed. Set `min-width: 0` on shrinking grid children and use safe wrapping for long filenames and extracted text.

Motion is limited to 120-180ms button/state feedback, a 180-220ms source entrance, and a brief Revisit emphasis. Animate opacity/transform for entrances; do not animate page geometry, rotate the close button, pulse decorative dots, or delay readable content. Disable nonessential movement and smooth scrolling under reduced motion.

At 1366×768, the entire upload action stack should fit within the first screen. In notes, the title, navigation, and first useful concept must appear immediately. At 390px, library/New, file selection, submit, and source close must remain usable without horizontal scrolling.

## 13. File-by-file implementation map

| File | Planned change |
| --- | --- |
| `src/App.jsx` | Compose compact header and content grid; wire view navigation, title mapping, complete Revisit, stale-request guards, and source reset behavior. Preserve reducer ownership of content/attempt. |
| `src/components/Sidebar.jsx` | Reuse the existing list as the library panel. Keep pack selection and New callbacks; add open/close presentation. |
| `src/components/UploadPanel.jsx` | Replace hero markup with upload workspace, selected-file state, real loading phases, and quieter sample action. Preserve subject/file callbacks. |
| `src/components/StudyPack.jsx` | Improve reading hierarchy and citation controls; retain `concept-${id}` anchors; support contextual outline and header integration. |
| `src/components/QuizPlayer.jsx` | Refine option/feedback layouts, add real concept titles, Back to notes, and final-question labeling. Keep scoring semantics in App. |
| `src/components/SourceDrawer.jsx` | Responsive dock/modal behavior, focus lifecycle, match scrolling, safe bounds, and readable evidence. |
| `src/main.jsx` | Import application styles once in explicit order. |
| `src/index.css` | Own reset, font inheritance, and base document rules only. |
| `src/styles.css` | Own tokens, primitives, app layouts, and component styles in clearly named sections. Replace retired selectors rather than layering overrides. |
| `src/hero.css`, `src/product.css` | Remove imports and retire these layers only after their still-used behavior is migrated. |
| `index.html` | Preserve StudyForge title and favicon; remove unused serif font loading after migration. |
| `src/components/AppHeader.jsx` | Optional small extraction if it keeps App readable. |
| `src/components/CitationButton.jsx` | Consolidate duplicated note/quiz citation rendering and accessible labels. |
| `src/components/SamplePreview.jsx` | Optional labelled sample excerpt, implemented after core screens. |

Do not edit `server/index.js`, `shared/studyPack.js`, `src/lib/pdf.js`, `src/lib/api.js`, `src/lib/export.js`, or the storage format for visual reasons. Existing helpers remain the integration boundary. The request helper already accepts an AbortSignal, so App can use it without an API change.

During CSS migration, map old token aliases to the new tokens temporarily so partially migrated screens remain usable. Remove legacy aliases/selectors after confirming no component references them. Do not append a new `remake.css` to override three older designs.

## 14. Execution order and time control

Estimated core remake: **100 minutes**, assuming the app already runs as reported. Treat this as a working estimate; use actual remaining hackathon time to trim optional work.

| Time | Task | Gate |
| --- | --- | --- |
| 0-5 min | Start current frontend, capture baseline screens, preserve a recoverable working snapshot. | Current upload, notes, practice, result, and source behavior understood. |
| 5-15 min | Tokens, consistent sans typography, stylesheet ownership, remove backdrop/texture conflict. | One coherent palette/type system; no broken controls. |
| 15-35 min | Compact header, library access, upload/selected/loading/error layouts. | First screenshot at 1366×768 clearly improves hierarchy; mobile can still access packs. |
| 35-55 min | Pack header, readable notes, citations, wide-screen docked evidence. | Note and highlighted source are visible together at demo width. |
| 55-75 min | Practice/results, concept titles, Back to notes, Revisit, state/focus fixes. | Complete mistake → results → note/source loop works with existing data. |
| 75-100 min | Narrow-screen panels, keyboard checks, regression run, production build, visual corrections. | Entire working flow survives; screenshots pass the acceptance list. |

Only after those gates, spend up to 20 extra minutes on the labelled sample preview, a wide-screen concept outline, and small motion details. Do not delay the notes/source experience to perfect the entry preview.

If only 45 minutes remain: use about 5 minutes for baseline, 15 for tokens/header/upload, 15 for notes/source and the most visible result/navigation issues, and 10 for regression/screenshots. Cut the example preview, outline, font hosting, and extractions. Keep accessible library access and protect the live workflow.

Do not spend this pass on a landing page, new logo generation, stock imagery, generated background art, chat, dark mode, accounts, PDF rendering, cloud sharing, or replacing working libraries.

## 15. Verification and acceptance

### Functional checks

- Upload and Try a sample lecture still use the existing extraction/API pipeline and retain subject style.
- A real supported upload renders notes, completes all five questions, and produces the same score behavior.
- Notes/Practice switches preserve the current attempt; Retry resets it intentionally.
- Results show concept titles, not internal IDs. Revisit opens the appropriate note and a citation from a missed question.
- A citation opens the correct filename, physical page, and highlighted text. The original note/question remains visible in docked mode.
- New/pack switching/Next clear stale evidence. A late response cannot replace a newly selected pack.
- Existing saved packs reopen; export still downloads the current pack through the existing exporter.
- Image-only/invalid PDF and service failures have readable recovery states; duplicate drop/sample actions are blocked during processing.

### Visual checks

- Capture upload empty, file selected, loading/error, notes, notes with source, submitted quiz answer, and results.
- Inspect 1366×768, 1440×900, 768×1024, and 390×844. Include long titles, a long filename, and long option/source text.
- Upload controls fit the first laptop screen; the header is compact; no large dark hero or unrelated dotted background remains.
- One font family, one accent system, consistent control dimensions, and deliberate spacing across every state.
- No sample-looking control that does nothing, internal IDs, fabricated stats, or false loading stages.
- Keyboard can choose a file, select options, open/close library and source, and return focus appropriately. Focus stays visible in both docked and modal presentations.
- Inspect 200% zoom and reduced motion. No clipped controls, lost mobile navigation, or horizontal page overflow.

### Project checks

Run the existing `npm test`, `npm run lint`, and `npm run build`. Add focused frontend regression checks for any changed state helper, especially stale-response rejection, Revisit mapping, and answer preservation. Do not install a large testing framework just to test styling.

Use a labelled development fixture for layout iteration if necessary, while keeping production upload behavior live. Finish with a real existing-pack session and one fresh generation. Inspect console/network errors and compare before/after screenshots; a successful build alone does not establish visual quality.

**Done means:** every essential screen follows the new system, the highlighted evidence interaction is clear at laptop width, mobile retains the complete flow, the existing backend contract remains intact, and the functional checks pass. Save the best final screenshot with the note and its source visible together.
