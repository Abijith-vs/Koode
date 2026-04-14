import express from 'express'
import { readHospitals } from '../lib/hospitalStore.js'

export const hospitalsRouter = express.Router()

hospitalsRouter.get('/hospitals', async (_req, res, next) => {
  try {
    const db = await readHospitals()
    res.json({ hospitals: db.hospitals })
  } catch (err) {
    next(err)
  }
})

hospitalsRouter.get('/hospitals/:id', async (req, res, next) => {
  try {
    const db = await readHospitals()
    const hospital = db.hospitals.find(h => h.id === req.params.id)
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' })
    res.json({ hospital })
  } catch (err) {
    next(err)
  }
})
