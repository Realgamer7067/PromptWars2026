// Browser-side PDF text extraction for StudyForge.
// Pure async module: no React, no DOM manipulation beyond PDF.js internals.

import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { LIMITS, normalizeText } from '../../shared/studyPack.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// A much lower bar than LIMITS.minReadableChars — just enough to say a page
// had "basically nothing extractable" (e.g. a title slide or pure-image page).
const MIN_PAGE_CHARS = 20;

function makeError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function isPasswordError(err) {
  if (!err) return false;
  const name = err.name || '';
  const message = err.message || '';
  if (name === 'PasswordException') return true;
  return /password/i.test(name) || /password/i.test(message);
}

/**
 * Joins PDF.js text content items into one string per page, using a simple
 * heuristic: insert a newline when the vertical position changes meaningfully
 * from the previous item, otherwise a space between items.
 */
function joinTextItems(textContent) {
  const items = textContent?.items || [];
  let result = '';
  let prevY = null;

  for (const item of items) {
    const str = typeof item.str === 'string' ? item.str : '';
    // item.transform: [a, b, c, d, e, f] — f is the vertical (y) position.
    const y = Array.isArray(item.transform) ? item.transform[5] : null;

    if (result.length === 0) {
      result += str;
    } else if (prevY !== null && y !== null && Math.abs(y - prevY) > 2) {
      result += '\n' + str;
    } else if (str) {
      result += ' ' + str;
    }

    if (y !== null) prevY = y;

    // PDF.js text items may carry an explicit end-of-line hint.
    if (item.hasEOL) {
      result += '\n';
    }
  }

  return result;
}

export async function extractPdfPages(file) {
  if (!file || typeof file.size !== 'number') {
    throw makeError('No file provided.', 'corrupt');
  }

  if (file.size > LIMITS.maxFileBytes) {
    throw makeError(
      `This file is too large for this prototype (max ${Math.floor(LIMITS.maxFileBytes / (1024 * 1024))}MB).`,
      'too_large',
    );
  }

  let pdf;
  try {
    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    pdf = await loadingTask.promise;
  } catch (err) {
    if (isPasswordError(err)) {
      throw makeError('This PDF is password-protected. Please remove the password and try again.', 'password_protected');
    }
    throw makeError('This PDF could not be read. It may be corrupt or in an unsupported format.', 'corrupt');
  }

  if (pdf.numPages > LIMITS.maxPages) {
    throw makeError(
      `This document has ${pdf.numPages} pages, which exceeds the ${LIMITS.maxPages}-page limit for this prototype.`,
      'too_many_pages',
    );
  }

  const pageMap = [];
  const omittedPages = [];
  let totalChars = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    let page;
    let textContent;
    try {
      page = await pdf.getPage(pageNumber);
      textContent = await page.getTextContent();
    } catch {
      omittedPages.push(pageNumber);
      continue;
    }

    const joined = joinTextItems(textContent);
    const normalized = normalizeText(joined);

    if (normalized.length < MIN_PAGE_CHARS) {
      omittedPages.push(pageNumber);
      continue;
    }

    pageMap.push({ pageNumber, text: normalized });
    totalChars += normalized.length;
  }

  if (totalChars > LIMITS.maxChars) {
    throw makeError('This lecture is too long for this prototype. Try a shorter document.', 'too_long');
  }

  if (totalChars < LIMITS.minReadableChars) {
    throw makeError('We could not extract enough text. Try a text-based lecture PDF.', 'insufficient_text');
  }

  return { pageMap, omittedPages, totalChars };
}
