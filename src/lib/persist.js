// Simple localStorage persistence helpers
export function loadState(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch { return defaultValue }
}

export function saveState(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
