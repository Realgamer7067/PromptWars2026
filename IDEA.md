# StudyForge — know what to revise, see where it came from

> Turn one lecture PDF into concise revision notes and five practice questions. When you miss a question, jump straight to the relevant note and its source passage.

**Build budget:** 2.5 hours, confirmed by the user. **Scope:** one lecture-to-revision workflow. **Status:** refined concept; implementation is pending. See [PLAN.md](PLAN.md) for the technical design and build sequence.

## 1. The student problem

A student finishes a lecture with a dense PDF but no usable revision material. Before studying, they have to identify the key ideas, rewrite them into notes, invent practice questions, and search the lecture again when an answer is confusing.

StudyForge removes that preparation work. One document becomes a reusable study pack: short notes, a five-question check, and direct links back to the lecture.

The promise is **less preparation, a clear next revision step, and inspectable sources**. Do not promise a particular time saving, better grades, or perfect factual accuracy without evidence.

## 2. The refined idea

Keep the original PDF → notes + quiz idea. Make the relationship between those outputs the distinctive part of the product:

```text
Upload lecture
    ↓
Read concise notes with page references
    ↓
Answer five questions about those same concepts
    ↓
See which concepts you missed
    ↓
Open the relevant note and supporting lecture passage
    ↓
Download the study pack
```

This remains one flow under the supplied brief. The quiz checks the revision material; the results send the student back into that same material. It does not need a separate tutor, planner, chat workspace, or integration hub.

## 3. The wow moment: a mistake becomes a revision action

Prepare a short, team-authored lecture about database transactions. Include five teachable concepts and a clear distinction between atomicity and durability.

1. The student answers a question about durability incorrectly, choosing the atomicity definition.
2. The answer panel explains the distinction and shows **View source · PDF p. 4**.
3. Clicking it opens a drawer with the document name, physical PDF page number, and the matching passage highlighted within text extracted from that page.
4. After the quiz, **Revisit durability →** jumps to the existing durability note and opens the supporting evidence.

The memorable behavior is: **“I got this wrong, and the app took me directly to what I should reread.”**

This is real and feasible within the budget: the question and note share a concept ID, and application code locates the source passage. No additional AI call is needed after generation.

The core drawer is labelled **Extracted page text**. Showing the original PDF page alongside it is an optional visual upgrade. Accurate highlighting on a rendered PDF is outside this build.

## 4. The experience

| Stage | Student sees | Important detail |
| --- | --- | --- |
| Start | “Your lecture, ready to revise.” PDF dropzone, Create study pack, optional subject style. | One obvious action; no signup or model settings. |
| Processing | Reading pages → Creating notes and questions → Checking source passages. | Stages reflect real work, with actual page counts and no fake percentages. |
| Notes | Three to five concise concept sections with individually cited bullets. | A readable study sheet, with Practice · 5 questions as the next action. |
| Practice | One question at a time, four options, feedback after submission. | Explanations and source passages stay hidden until the answer is submitted. |
| Results | “3/5 this attempt” and Revisit actions for missed concepts. | Every action leads to an existing note and its evidence. |
| Take away | A Markdown download containing notes, questions, and a separate answer key. | Implement this bonus after the complete core works. |

For a perfect attempt, say **“You answered all five correctly. Review the notes or retry the practice.”** Five questions do not establish lecture mastery or exam readiness; avoid those scores and claims.

A **Try a sample lecture** action selects the bundled PDF and runs the same real pipeline as an upload. It must not silently load a prepared result.

## 5. What the source check actually proves

The model proposes a page number and exact quote for each note bullet and quiz question. Application code independently checks whether that quote occurs on the declared page of the extracted PDF text.

| Wording | Meaning |
| --- | --- |
| **Passage located · PDF p. 4** | The app found the quote on the cited page. |
| **Source not located** | A candidate quote failed matching; it cannot be presented as checked evidence. |
| **Extracted page text** | The evidence comes from PDF extraction, not another AI explanation. |

**Finding a quote does not prove that the generated claim follows from it or that the answer key is correct.** The drawer makes that relationship easy to inspect. Avoid “hallucination-free,” “verified answer,” or “proves every answer.”

Failed source checks allow one bounded regeneration attempt. A pack that still fails validation becomes an explicit generation failure, with a retry action. It is not passed off as a completed, checked quiz.

## 6. Why this is a useful AI product

- **AI contribution:** condense the lecture, select related concepts, and generate questions with plausible distractors.
- **Application contribution:** preserve page identity, validate structure and quoted passages, connect questions to notes, score an attempt, and route mistakes to relevant revision material.
- **Experience contribution:** inspect evidence and act on a mistake without searching the PDF or writing another prompt.

Demonstrate these qualities. Do not claim citation-backed study tools are a new category or that competitors cannot do this; no competitive comparison has been established here.

## 7. Scope for 150 minutes

| Priority | Deliverable | Why it earns its place |
| --- | --- | --- |
| P0 | Text PDF upload and real AI generation | Completes the central input-to-output claim. |
| P0 | Notes and exactly five playable questions | Produces usable revision material. |
| P0 | Page-aware source checks and evidence drawer | Makes technical depth visible. |
| P0 | Score, missed concepts, and Revisit links | Gives the flow an actionable ending. |
| P0 | Finished upload, results, loading, and error states | Protects the screens judges actually see. |
| P0 | Server-held API key and bounded requests | Enables a controlled working demo. |
| P1, first | Markdown study-pack download | Provides the shareable-output bonus. |
| P1 | General / STEM / Humanities / Language style | Adds light personalisation within the same source material. |
| P1 | Recent packs on this browser | Adds continuity after the core works. |
| P1, last | Original PDF page preview | Adds visual context only if there is spare time. |

Exclude OCR, DOCX/PPTX parsing, multiple simultaneous files, chat, flashcards, mind maps, calendars, accounts, cloud sync, adaptive difficulty, audio, provider settings, and dark mode from the 2.5-hour target.

## 8. Visual identity

Keep the calm, Apple-inspired finish from the earlier plan, with a recognisable study surface: warm off-white canvas, crisp white paper, graphite type, restrained blue actions, and pale yellow source highlights.

Use a narrow sidebar and a spacious document area. Open evidence in a right drawer on a laptop and a full-width sheet on mobile. Prefer clear type hierarchy and thin dividers over many nested rounded cards.

The distinctive visual is **the note or answer beside its highlighted source passage**. Spend polish there. A 150–200 ms drawer transition and a brief highlight on the selected note are enough motion.

## 9. Ninety-second demo story

This is a rehearsal format; the official presentation duration and fallback rules are unknown.

| Time | Action | What the judge understands |
| --- | --- | --- |
| 0–12s | Show the lecture PDF and upload it. | The input is real student material. |
| 12–30s | Generate; explain the source checks during the wait. | One pipeline creates notes and practice questions. |
| 30–42s | Show the notes and a page reference. | The output is readable and traceable. |
| 42–60s | Submit a wrong answer and open its source. | The supporting passage is inspectable. |
| 60–78s | Complete the remaining questions; use Revisit. | A mistake becomes a specific revision action. |
| 78–90s | Download if implemented; close on the notes/source view. | The student leaves with material they can keep. |

Select a wrong option from the generated answer key during rehearsal; fresh generation may change question order and wording. If generation runs long, explicitly switch to a saved example only if event rules permit it. Never simulate successful live generation.

**Closing line:** “StudyForge turns a lecture into something you can revise, test yourself on, and check against the source.”

## 10. Fit with the supplied brief

| Requirement | Visible evidence |
| --- | --- |
| One polished flow | Lecture upload → revision pack → practice → targeted rereading. |
| End-to-end completion | A real PDF produces usable notes and a completed five-question attempt. |
| Remove student busywork | Automates note preparation and question drafting. |
| Shareable export bonus | Markdown notes, quiz, page references, and a separate answer key. |
| Personalisation bonus | Optional subject emphasis without adding outside facts. |
| Multiple-format bonus | Deferred to protect the working PDF flow. |

No judging weights, sponsor requirements, or official submission rules were provided. This is a scope-fit assessment, not an invented scoring rubric.
