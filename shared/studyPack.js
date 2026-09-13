// Shared contract + validation + quote-matching for StudyPack generation.
// Imported by both the server (Node, ESM) and the browser (Vite). Keep this
// file free of Node-only or DOM-only APIs.

export const LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  maxPages: 30,
  maxChars: 60000,
  minReadableChars: 200,
  minQuoteWords: 8,
};

export function normalizeText(raw) {
  if (typeof raw !== 'string') return '';
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function countWords(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Exact, case-sensitive substring match of a quote within its declared page. */
export function checkCitation(citation, pageMap) {
  const base = { pageNumber: citation?.pageNumber, quote: citation?.quote || '' };
  const page = pageMap.find((p) => p.pageNumber === citation?.pageNumber);
  if (!page) return { ...base, status: 'invalid_page', matched: false };

  const quote = normalizeText(citation.quote || '');
  if (!quote || countWords(quote) < LIMITS.minQuoteWords) {
    return { ...base, status: 'not_found', matched: false };
  }
  const idx = page.text.indexOf(quote);
  if (idx === -1) {
    return { ...base, status: 'not_found', matched: false };
  }
  return {
    ...base,
    status: 'located',
    matched: true,
    matchStart: idx,
    matchEnd: idx + quote.length,
    pageText: page.text,
  };
}

/** Structural validation of the model's JSON result. Does not check citations. */
export function validateModelResult(result) {
  const errors = [];
  if (!result || typeof result !== 'object') return { ok: false, errors: ['empty or non-object result'] };

  if (result.status === 'insufficient_content') {
    return { ok: true, insufficient: true, reason: result.reason || 'Not enough usable lecture content.' };
  }
  if (result.status !== 'ok') errors.push(`unknown status "${result.status}"`);

  const concepts = Array.isArray(result.concepts) ? result.concepts : [];
  const quiz = Array.isArray(result.quiz) ? result.quiz : [];

  if (concepts.length < 3 || concepts.length > 5) {
    errors.push(`expected 3-5 concepts, got ${concepts.length}`);
  }

  const conceptIds = new Set();
  for (const c of concepts) {
    if (!c?.id || conceptIds.has(c.id)) errors.push(`missing or duplicate concept id "${c?.id}"`);
    conceptIds.add(c?.id);
    if (!c?.title?.trim()) errors.push(`concept "${c?.id}" missing title`);
    const bullets = Array.isArray(c?.bullets) ? c.bullets : [];
    if (bullets.length < 2 || bullets.length > 3) {
      errors.push(`concept "${c?.id}" needs 2-3 bullets, got ${bullets.length}`);
    }
    for (const b of bullets) {
      if (!b?.text?.trim()) errors.push(`bullet missing text in concept "${c?.id}"`);
      if (!b?.citation || typeof b.citation.pageNumber !== 'number' || !b.citation.quote?.trim()) {
        errors.push(`bullet missing valid citation in concept "${c?.id}"`);
      }
    }
  }

  if (quiz.length !== 5) errors.push(`expected exactly 5 questions, got ${quiz.length}`);

  const questionIds = new Set();
  const testedConcepts = new Set();
  for (const q of quiz) {
    if (!q?.id || questionIds.has(q.id)) errors.push(`missing or duplicate question id "${q?.id}"`);
    questionIds.add(q?.id);

    if (!conceptIds.has(q?.conceptId)) {
      errors.push(`question "${q?.id}" references unknown concept "${q?.conceptId}"`);
    } else {
      testedConcepts.add(q.conceptId);
    }

    const options = Array.isArray(q?.options) ? q.options : [];
    const trimmed = options.map((o) => (typeof o === 'string' ? o.trim() : ''));
    const unique = new Set(trimmed);
    if (options.length !== 4 || unique.size !== 4 || trimmed.some((o) => !o)) {
      errors.push(`question "${q?.id}" needs exactly 4 distinct non-empty options`);
    }
    if (!Number.isInteger(q?.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
      errors.push(`question "${q?.id}" has an invalid correctIndex`);
    }
    if (!q?.explanation?.trim()) errors.push(`question "${q?.id}" missing explanation`);
    if (!q?.citation || typeof q.citation.pageNumber !== 'number' || !q.citation.quote?.trim()) {
      errors.push(`question "${q?.id}" missing valid citation`);
    }
  }

  for (const id of conceptIds) {
    if (!testedConcepts.has(id)) errors.push(`concept "${id}" is never tested by a question`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, insufficient: false };
}

/**
 * Checks every citation (note bullets + quiz questions) against the retained
 * page map. Returns the annotated pack plus a flat list of failures suitable
 * for feeding back into a repair prompt.
 */
export function checkAllCitations(result, pageMap) {
  const failures = [];

  const concepts = result.concepts.map((c) => ({
    ...c,
    bullets: c.bullets.map((b) => {
      const citation = checkCitation(b.citation, pageMap);
      if (!citation.matched) {
        failures.push({ type: 'bullet', conceptId: c.id, citation, reason: citation.status });
      }
      return { ...b, citation };
    }),
  }));

  const quiz = result.quiz.map((q) => {
    const citation = checkCitation(q.citation, pageMap);
    if (!citation.matched) {
      failures.push({ type: 'question', questionId: q.id, conceptId: q.conceptId, citation, reason: citation.status });
    }
    return { ...q, citation };
  });

  return { ok: failures.length === 0, failures, pack: { ...result, concepts, quiz } };
}

export function summarizeFailuresForRepair(failures) {
  return failures
    .map((f) =>
      f.type === 'bullet'
        ? `Bullet in concept "${f.conceptId}": citation quote "${f.citation.quote}" was not found on declared page ${f.citation.pageNumber}.`
        : `Question "${f.questionId}" (concept "${f.conceptId}"): citation quote "${f.citation.quote}" was not found on declared page ${f.citation.pageNumber}.`,
    )
    .join('\n');
}
