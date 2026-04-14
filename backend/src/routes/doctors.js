import express from 'express'
import { readAuth } from '../lib/authStore.js'

export const doctorsRouter = express.Router()

function publicDoctor(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department ?? '',
    createdAt: u.createdAt,
  }
}

doctorsRouter.get('/doctors', async (req, res, next) => {
  try {
    const department = String(req.query.department ?? '').trim().toLowerCase()
    const db = await readAuth()
    let doctors = db.users.filter((u) => u.role === 'doctor')
    if (department) {
      doctors = doctors.filter((d) => String(d.department ?? '').trim().toLowerCase() === department)
    }
    res.json({ doctors: doctors.map(publicDoctor) })
  } catch (err) {
    next(err)
  }
})

doctorsRouter.get('/departments', async (_req, res, next) => {
  try {
    const db = await readAuth()
    const departments = Array.from(
      new Set(
        db.users
          .filter((u) => u.role === 'doctor')
          .map((u) => String(u.department ?? '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b))
    res.json({ departments })
  } catch (err) {
    next(err)
  }
})

