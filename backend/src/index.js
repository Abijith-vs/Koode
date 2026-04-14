import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { organeaseRouter } from './routes/organease.js'
import { authRouter } from './routes/auth.js'
import { doctorsRouter } from './routes/doctors.js'
import { appointmentsRouter } from './routes/appointments.js'
import { hospitalsRouter } from './routes/hospitals.js'
import { ensureSeedAdmin } from './lib/seedAdmin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()

app.use(morgan('dev'))
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api', (_req, res) => {
  res.json({ message: 'Koode API (Node + Express)' })
})

app.use('/api', authRouter)
app.use('/api', doctorsRouter)
app.use('/api', appointmentsRouter)
app.use('/api', hospitalsRouter)
app.use('/api', organeaseRouter)

app.use((err, _req, res, next) => {
  // Keep Express error middleware signature.
  void next
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const port = Number(process.env.PORT) || 8000
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

void ensureSeedAdmin().catch((err) => {
  console.error('Failed to seed admin user')
  console.error(err)
})

export default app

