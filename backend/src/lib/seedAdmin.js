import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { readAuth, writeAuth } from './authStore.js'

export async function ensureSeedAdmin() {
  const email = String(process.env.ADMIN_EMAIL ?? '').toLowerCase().trim()
  const password = String(process.env.ADMIN_PASSWORD ?? '').trim()
  if (!email || !password) return { seeded: false }

  const db = await readAuth()
  const existing = db.users.find((u) => u.email.toLowerCase() === email)
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin'
      await writeAuth(db)
    }
    return { seeded: false }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  db.users.unshift({
    id: `usr_${randomUUID()}`,
    name: 'Admin',
    email,
    passwordHash,
    role: 'admin',
    department: '',
    createdAt: new Date().toISOString(),
  })
  await writeAuth(db)
  return { seeded: true, email }
}

