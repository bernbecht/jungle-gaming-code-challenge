import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Auditoria exploratória da home. A matriz final pertence à TASK-14.
await mkdir('artifacts/lighthouse', { recursive: true })
const cli = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url))
const child = spawn(process.execPath, [
  cli,
  'http://127.0.0.1:4173/',
  '--output=html',
  '--output=json',
  '--output-path=artifacts/lighthouse/home',
  '--chrome-flags=--headless',
], { stdio: 'inherit' })
child.on('error', error => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', code => { process.exitCode = code ?? 1 })
