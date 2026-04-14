import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const HOSPITALS_PATH = path.join(DATA_DIR, 'hospitals.json')

async function ensureHospitalsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(HOSPITALS_PATH)
  } catch {
    const seed = { hospitals: [] }
    await fs.writeFile(HOSPITALS_PATH, JSON.stringify(seed, null, 2), 'utf8')
  }
}

export async function readHospitals() {
  await ensureHospitalsFile()
  const raw = await fs.readFile(HOSPITALS_PATH, 'utf8')
  return JSON.parse(raw)
}

export async function writeHospitals(next) {
  await ensureHospitalsFile()
  await fs.writeFile(HOSPITALS_PATH, JSON.stringify(next, null, 2), 'utf8')
}
