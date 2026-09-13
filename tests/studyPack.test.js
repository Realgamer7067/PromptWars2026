import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCitation, validateModelResult, checkAllCitations, normalizeText } from '../shared/studyPack.js';

const pageMap = [
  { pageNumber: 1, text: normalizeText('Durability means that once a transaction has been committed, has been committed, its effects survive any subsequent crash.') },
  { pageNumber: 2, text: normalizeText('Atomicity requires that either every operation in a transaction is applied, or none are.') },
];

test('citation matches after whitespace/line-break normalization', () => {
  const result = checkCitation(
    { pageNumber: 1, quote: 'Durability means that once a\ntransaction has been committed' },
    pageMap,
  );
  assert.equal(result.matched, true);
  assert.equal(result.status, 'located');
});

test('real quote on the wrong page fails, no cross-page match', () => {
  const result = checkCitation(
    { pageNumber: 2, quote: 'Durability means that once a transaction has been committed' },
    pageMap,
  );
  assert.equal(result.matched, false);
  assert.equal(result.status, 'not_found');
});

test('a changed word fails exact matching', () => {
  const result = checkCitation(
    { pageNumber: 1, quote: 'Durability means that once a transaction has been rejected' },
    pageMap,
  );
  assert.equal(result.matched, false);
});

test('empty or too-short quote is rejected', () => {
  const result = checkCitation({ pageNumber: 1, quote: 'crash' }, pageMap);
  assert.equal(result.matched, false);
});

test('citation on a nonexistent page fails validation', () => {
  const result = checkCitation({ pageNumber: 99, quote: 'anything at all here really' }, pageMap);
  assert.equal(result.status, 'invalid_page');
});

function buildValidPack() {
  return {
    status: 'ok',
    reason: '',
    title: 'Test Pack',
    concepts: [
      {
        id: 'c1',
        title: 'Durability',
        bullets: [
          { text: 'Durability survives crashes.', citation: { pageNumber: 1, quote: 'Durability means that once a transaction has been committed' } },
          { text: 'It is permanent.', citation: { pageNumber: 1, quote: 'has been committed, its effects survive any subsequent crash' } },
        ],
      },
      {
        id: 'c2',
        title: 'Atomicity',
        bullets: [
          { text: 'Atomicity is all-or-nothing.', citation: { pageNumber: 2, quote: 'either every operation in a transaction is applied, or none are' } },
          { text: 'No partial state.', citation: { pageNumber: 2, quote: 'Atomicity requires that either every operation in a transaction' } },
        ],
      },
      {
        id: 'c3',
        title: 'Consistency',
        bullets: [
          { text: 'Rules are enforced.', citation: { pageNumber: 1, quote: 'Durability means that once a transaction has been committed' } },
          { text: 'Valid states only.', citation: { pageNumber: 2, quote: 'Atomicity requires that either every operation in a transaction' } },
        ],
      },
    ],
    quiz: [
      { id: 'q1', conceptId: 'c1', kind: 'recall', question: 'Q1?', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'e', citation: { pageNumber: 1, quote: 'Durability means that once a transaction has been committed' } },
      { id: 'q2', conceptId: 'c2', kind: 'recall', question: 'Q2?', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'e', citation: { pageNumber: 2, quote: 'Atomicity requires that either every operation in a transaction' } },
      { id: 'q3', conceptId: 'c3', kind: 'understanding', question: 'Q3?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'e', citation: { pageNumber: 1, quote: 'has been committed, its effects survive any subsequent crash' } },
      { id: 'q4', conceptId: 'c1', kind: 'application', question: 'Q4?', options: ['a', 'b', 'c', 'd'], correctIndex: 3, explanation: 'e', citation: { pageNumber: 2, quote: 'either every operation in a transaction is applied, or none are' } },
      { id: 'q5', conceptId: 'c2', kind: 'recall', question: 'Q5?', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'e', citation: { pageNumber: 1, quote: 'Durability means that once a transaction has been committed' } },
    ],
  };
}

test('a fully valid pack passes structural validation and all citations', () => {
  const pack = buildValidPack();
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, true);
  const citations = checkAllCitations(pack, pageMap);
  assert.equal(citations.ok, true);
  assert.equal(citations.failures.length, 0);
});

test('four questions instead of five is rejected', () => {
  const pack = buildValidPack();
  pack.quiz.pop();
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, false);
  assert.ok(structural.errors.some((e) => e.includes('exactly 5 questions')));
});

test('duplicate option values are rejected', () => {
  const pack = buildValidPack();
  pack.quiz[0].options = ['same', 'same', 'c', 'd'];
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, false);
});

test('an out-of-range correctIndex is rejected', () => {
  const pack = buildValidPack();
  pack.quiz[0].correctIndex = 5;
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, false);
});

test('a question referencing an unknown concept is rejected', () => {
  const pack = buildValidPack();
  pack.quiz[0].conceptId = 'does-not-exist';
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, false);
  assert.ok(structural.errors.some((e) => e.includes('unknown concept')));
});

test('a concept never tested by any question is rejected', () => {
  const pack = buildValidPack();
  pack.quiz.forEach((q) => { q.conceptId = 'c1'; });
  const structural = validateModelResult(pack);
  assert.equal(structural.ok, false);
  assert.ok(structural.errors.some((e) => e.includes('never tested')));
});

test('insufficient_content short-circuits structural checks', () => {
  const result = validateModelResult({ status: 'insufficient_content', reason: 'Not enough material.', concepts: [], quiz: [] });
  assert.equal(result.ok, true);
  assert.equal(result.insufficient, true);
  assert.equal(result.reason, 'Not enough material.');
});
