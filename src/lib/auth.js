const TOKEN_KEY = 'koode_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY }))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY }))
}

