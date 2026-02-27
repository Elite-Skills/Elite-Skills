import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(serverRoot, '.env') })
dotenv.config({ path: path.join(serverRoot, '.env.local') })

import 'express-async-errors'

import compression from 'compression'
import express from 'express'
import { createServer } from 'http'
import type { Request, Response } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { Server } from 'socket.io'

import { connectToDatabase } from './db.js'
import { authRouter } from './routes/auth.js'
import { scanRouter } from './routes/scan.js'
import { profileRouter } from './routes/profile.js'
import { referralsRouter } from './routes/referrals.js'
import { requestsRouter } from './routes/requests.js'
import { connectionsRouter } from './routes/connections.js'
import { chatRouter } from './routes/chat.js'
import { notificationsRouter } from './routes/notifications.js'
import { boardroomRouter } from './routes/boardroom.js'
import { strategyRouter } from './routes/strategy.js'
import { setupSocketIo } from './socket.js'

const app = express()

app.disable('x-powered-by')

// Required on Render/Vercel etc. - reverse proxy sets X-Forwarded-For
const trustProxy = process.env.TRUST_PROXY !== undefined
  ? String(process.env.TRUST_PROXY).toLowerCase() === 'true'
  : process.env.NODE_ENV === 'production'
app.set('trust proxy', trustProxy ? 1 : false)

app.use(express.json({ limit: '2mb' }))

app.use(helmet())
app.use(compression())

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
)

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const allowedOrigins = String(process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const isProd = String(process.env.NODE_ENV ?? '').toLowerCase() === 'production'
if (isProd && allowedOrigins.length === 0) {
  console.warn('WARNING: CLIENT_ORIGIN not set in production. CORS will allow all origins. Set CLIENT_ORIGIN in Render Environment for security.')
}

app.use(
  cors((req, callback) => {
    const origin = String(req.headers.origin ?? '')

    if (!origin) {
      callback(null, { origin: false })
      return
    }

    if (allowedOrigins.length > 0) {
      callback(null, {
        origin: allowedOrigins.includes(origin),
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
      return
    }

    callback(null, { origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] })
  })
)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/scan', scanRouter)
app.use('/api/profile', profileRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/connections', connectionsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/boardroom', boardroomRouter)
app.use('/api/strategy', strategyRouter)

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: unknown) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

const port = Number(process.env.PORT ?? 5000)

await connectToDatabase()

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
})

app.set('io', io)

setupSocketIo(io)

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
