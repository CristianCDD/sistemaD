import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(rootDir, 'dist')
const indexFile = join(distDir, 'index.html')
const routes = ['landing', 'guia-materiales', 'materiales']

await Promise.all(routes.map(async (route) => {
  const routeDir = join(distDir, route)
  await mkdir(routeDir, { recursive: true })
  await copyFile(indexFile, join(routeDir, 'index.html'))
}))
