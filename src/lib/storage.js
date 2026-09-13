const KEY = 'studyforge:recentPacks';
const MAX_PACKS = 5;
const MAX_BYTES = 2 * 1024 * 1024;

export function listRecentPacks() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentPack(entry) {
  try {
    const existing = listRecentPacks().filter((p) => p.id !== entry.id);
    let next = [entry, ...existing].slice(0, MAX_PACKS);
    while (next.length > 1 && JSON.stringify(next).length > MAX_BYTES) {
      next = next.slice(0, -1);
    }
    localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function deleteRecentPack(id) {
  try {
    const next = listRecentPacks().filter((p) => p.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — nothing to persist, continue in memory
  }
}

export function clearRecentPacks() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
