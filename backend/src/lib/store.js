import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const ORGANEASE_PATH = path.join(DATA_DIR, 'organease.json')

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(ORGANEASE_PATH)
  } catch {
    const seed = {
      organs: [
        {
          id: 'org_heart_1',
          type: 'Heart',
          bloodGroup: 'O+',
          center: 'Dhaka Procurement Center',
          status: 'available',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'org_kidney_1',
          type: 'Kidney',
          bloodGroup: 'A+',
          center: 'Chittagong Transplant Center',
          status: 'available',
          createdAt: new Date().toISOString(),
        },
      ],
      requests: [],
    }
    await fs.writeFile(ORGANEASE_PATH, JSON.stringify(seed, null, 2), 'utf8')
  }
}

export async function readOrganEase() {
  await ensureDataFile()
  const raw = await fs.readFile(ORGANEASE_PATH, 'utf8')
  return JSON.parse(raw)
}

export async function writeOrganEase(next) {
  await ensureDataFile()
  await fs.writeFile(ORGANEASE_PATH, JSON.stringify(next, null, 2), 'utf8')
}

