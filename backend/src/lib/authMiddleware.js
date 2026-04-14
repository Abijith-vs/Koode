import jwt from 'jsonwebtoken'
import { readAuth } from './authStore.js'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET env var')
  return secret
}

export async function getUserFromRequest(req) {
  const auth = req.header('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  if (!token) return null

  const payload = jwt.verify(token, getJwtSecret())
  const userId = payload?.sub
  if (!userId) return null

  const db = await readAuth()
  return db.users.find((u) => u.id === userId) ?? null
}

export function requireAuth() {
  return async (req, res, next) => {
    try {
      const user = await getUserFromRequest(req)
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      req.user = user
      next()
    } catch {
      res.status(401).json({ error: 'Unauthorized' })
    }
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (user.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

