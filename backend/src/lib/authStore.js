import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const AUTH_PATH = path.join(DATA_DIR, 'auth.json')

async function ensureAuthFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(AUTH_PATH)
  } catch {
    const seed = { users: [] }
    await fs.writeFile(AUTH_PATH, JSON.stringify(seed, null, 2), 'utf8')
  }
}

export async function readAuth() {
  await ensureAuthFile()
  const raw = await fs.readFile(AUTH_PATH, 'utf8')
  return JSON.parse(raw)
}

export async function writeAuth(next) {
  await ensureAuthFile()
  await fs.writeFile(AUTH_PATH, JSON.stringify(next, null, 2), 'utf8')
}

