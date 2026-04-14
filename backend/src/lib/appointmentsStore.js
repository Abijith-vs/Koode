import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const APPOINTMENTS_PATH = path.join(DATA_DIR, 'appointments.json')

async function ensureAppointmentsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(APPOINTMENTS_PATH)
  } catch {
    const seed = { appointments: [] }
    await fs.writeFile(APPOINTMENTS_PATH, JSON.stringify(seed, null, 2), 'utf8')
  }
}

export async function readAppointments() {
  await ensureAppointmentsFile()
  const raw = await fs.readFile(APPOINTMENTS_PATH, 'utf8')
  return JSON.parse(raw)
}

export async function writeAppointments(next) {
  await ensureAppointmentsFile()
  await fs.writeFile(APPOINTMENTS_PATH, JSON.stringify(next, null, 2), 'utf8')
}

