export async function requestStudyPack(pageMap, subject, { signal } = {}) {
  const res = await fetch('/api/study-pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageMap, subject }),
    signal,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = body?.error || 'Generation failed. Please try again.';
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body; // { status: 'ok', pack } | { status: 'insufficient_content', reason }
}
