import { spawn } from 'child_process'
import process from 'process'
import { warmupRoutes } from './warmup-pages.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const port = process.env.PORT ? Number(process.env.PORT) : 3000
const host = process.env.HOST || '0.0.0.0'
const baseUrl = process.env.WARMUP_BASE_URL || `http://127.0.0.1:${port}`

const devProcess = spawn('npm', ['run', 'dev', '--', '--hostname', host, '--port', String(port)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

const stopDevServer = () => {
  if (!devProcess.killed) {
    devProcess.kill()
  }
}

process.on('SIGINT', stopDevServer)
process.on('SIGTERM', stopDevServer)
process.on('exit', stopDevServer)

const waitForServer = async () => {
  const maxAttempts = 60
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (devProcess.exitCode !== null) {
      throw new Error(`El servidor de desarrollo terminó antes de estar listo (código ${devProcess.exitCode})`)
    }

    try {
      const response = await fetch(baseUrl, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500) {
        return
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
    }
    await sleep(1000)
  }
}

try {
  await waitForServer()
  await warmupRoutes({ baseUrl, port })
} catch (error) {
  console.error('[dev:warm] Error al precalentar rutas:', error)
}

const exitCode = await new Promise((resolve) => {
  devProcess.on('exit', (code) => {
    resolve(code ?? 0)
  })
})

process.exit(exitCode)
