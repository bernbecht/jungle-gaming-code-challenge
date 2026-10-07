import { toSocketIo } from '@mswjs/socket.io-binding'
import { http, HttpResponse, ws } from 'msw'

// MSW normalizes Socket.IO's default `/socket.io/` path to `/` before matching ws.link.
const socket = ws.link(window.location.origin.replace(/^http/, 'ws'))

export const handlers = [
  http.get('/api/__proof', () => HttpResponse.json({
    source: 'msw',
    transport: 'axios',
    scenario: 'SCN-01',
  })),
  socket.addEventListener('connection', (connection) => {
    const { client } = toSocketIo(connection)
    // The binding's `client` wrapper receives frames sent by socket.io-client
    // and sends mock frames back to that same client connection.
    client.on('proof.request', () => {
      client.emit('proof.event', { source: 'msw', transport: 'socket.io' })
    })
  }),
]
