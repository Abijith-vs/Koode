import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { readAuth, writeAuth } from '../lib/authStore.js'
import { getUserFromRequest } from '../lib/authMiddleware.js'

export const authRouter = express.Router()

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Missing JWT_SECRET env var')
  }
  return secret
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, department: u.department ?? '', createdAt: u.createdAt }
}

authRouter.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body ?? {}
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' })
    }

    const db = await readAuth()
    const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(String(password), 10)
    const normalizedRole = role === 'doctor' ? 'doctor' : 'patient'
    const user = {
      id: `usr_${randomUUID()}`,
      name: String(name),
      email: String(email).toLowerCase(),
      passwordHash,
      role: normalizedRole,
      department: normalizedRole === 'doctor' ? String(department ?? '').trim() : '',
      createdAt: new Date().toISOString(),
    }
    db.users.unshift(user)
    await writeAuth(db)

    const token = jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: '7d' })
    res.status(201).json({ token, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password are required' })
    }
    const db = await readAuth()
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: '7d' })
    res.json({ token, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/auth/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}
    if (!email || !password) return res.status(400).json({ error: 'email, password are required' })

    const db = await readAuth()
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
    if (!user || user.role !== 'admin') return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: '7d' })
    res.json({ token, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

authRouter.get('/auth/me', async (req, res) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    res.json({ user: publicUser(user) })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

