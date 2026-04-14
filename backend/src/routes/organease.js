import { randomUUID } from 'node:crypto'
import express from 'express'
import { readOrganEase, writeOrganEase } from '../lib/store.js'
import { requireAuth, requireRole } from '../lib/authMiddleware.js'

export const organeaseRouter = express.Router()

organeaseRouter.get('/organease/organs', async (_req, res, next) => {
  try {
    const db = await readOrganEase()
    res.json({ organs: db.organs })
  } catch (err) {
    next(err)
  }
})

organeaseRouter.post('/organease/organs', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const { type, bloodGroup, center } = req.body ?? {}
    if (!type || !bloodGroup || !center) {
      return res.status(400).json({ error: 'type, bloodGroup, center are required' })
    }

    const db = await readOrganEase()
    const organ = {
      id: `org_${randomUUID()}`,
      type,
      bloodGroup,
      center,
      status: 'available',
      createdAt: new Date().toISOString(),
    }
    db.organs.unshift(organ)
    await writeOrganEase(db)
    res.status(201).json({ organ })
  } catch (err) {
    next(err)
  }
})

organeaseRouter.patch('/organease/organs/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const organId = String(req.params.id)
    const { type, bloodGroup, center, status } = req.body ?? {}

    const db = await readOrganEase()
    const organ = db.organs.find((o) => o.id === organId)
    if (!organ) return res.status(404).json({ error: 'Organ not found' })

    if (type != null) organ.type = String(type)
    if (bloodGroup != null) organ.bloodGroup = String(bloodGroup)
    if (center != null) organ.center = String(center)
    if (status != null) organ.status = String(status)

    await writeOrganEase(db)
    res.json({ organ })
  } catch (err) {
    next(err)
  }
})

organeaseRouter.delete('/organease/organs/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const organId = String(req.params.id)
    const db = await readOrganEase()
    const before = db.organs.length
    db.organs = db.organs.filter((o) => o.id !== organId)
    if (db.organs.length === before) return res.status(404).json({ error: 'Organ not found' })
    await writeOrganEase(db)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

organeaseRouter.post('/organease/requests', requireAuth(), async (req, res, next) => {
  try {
    const user = req.user
    const { organId, notes } = req.body ?? {}
    if (!organId) {
      return res.status(400).json({ error: 'organId is required' })
    }

    const db = await readOrganEase()
    const organ = db.organs.find((o) => o.id === organId)
    if (!organ) return res.status(404).json({ error: 'Organ not found' })
    if (organ.status !== 'available') {
      return res.status(409).json({ error: `Organ is ${organ.status}` })
    }

    const request = {
      id: `req_${randomUUID()}`,
      organId,
      requesterName: user.name,
      requesterEmail: user.email,
      requesterId: user.id,
      notes: notes ?? '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    db.requests.unshift(request)
    organ.status = 'reserved'
    await writeOrganEase(db)
    res.status(201).json({ request })
  } catch (err) {
    next(err)
  }
})

organeaseRouter.get('/organease/requests', requireAuth(), requireRole('admin'), async (_req, res, next) => {
  try {
    const db = await readOrganEase()
    res.json({ requests: db.requests })
  } catch (err) {
    next(err)
  }
})

