import { useState } from 'react'
import { http } from '@/lib/http'

type ProofResponse = { source: string; transport: string; scenario: string }

export function IntegrationProofPage() {
  const [result, setResult] = useState<ProofResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [socketResult, setSocketResult] = useState<string | null>(null)

  async function verifyRest() {
    setLoading(true)
    setError(null)
    try {
      const response = await http.get<ProofResponse>('/__proof')
      setResult(response.data)
    } catch {
      setResult(null)
      setError('A chamada de prova não foi interceptada. Confira o worker e a configuração de mocks.')
    } finally {
      setLoading(false)
    }
  }

  async function verifySocket() {
    setLoading(true)
    setError(null)
    setSocketResult(null)
    let socket: import('socket.io-client').Socket | undefined
    try {
      // Import after MSW starts: the worker must patch WebSocket before socket.io-client loads.
      const { io } = await import('socket.io-client')
      socket = io(window.location.origin, {
        path: '/socket.io/',
        transports: ['websocket'],
        reconnection: false,
        timeout: 5_000,
      })
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('response-timeout')), 6_000)
        socket?.once('proof.event', (payload: { source: string; transport: string }) => {
          window.clearTimeout(timer)
          setSocketResult(`${payload.transport} → ${payload.source}`)
          resolve()
        })
        socket?.once('connect', () => socket?.emit('proof.request'))
        socket?.once('connect_error', () => {
          window.clearTimeout(timer)
          reject(new Error('connection'))
        })
      })
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'response-timeout'
        ? 'O handshake concluiu e o cliente enviou proof.request, mas o mock não respondeu proof.event.'
        : 'O handshake do cliente Socket.IO não concluiu. Confira o worker e o endpoint do mock.')
    } finally {
      socket?.disconnect()
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-16">
      <p className="text-xs font-medium tracking-widest text-muted-foreground">DIAGNÓSTICO INTERNO · TASK-03</p>
      <h1 className="text-2xl font-semibold">Prova de integração de rede</h1>
      <p className="text-sm leading-6 text-muted-foreground">Esta rota de diagnóstico valida requisições Axios e eventos Socket.IO recebidos do MSW no navegador.</p>
      <button className="rounded-md border px-4 py-2 text-sm focus-visible:outline-2" onClick={() => void verifyRest()} disabled={loading}>
        {loading ? 'Verificando…' : 'Executar prova REST'}
      </button>
      {result && <output aria-live="polite" className="block rounded-md border p-4 text-sm" data-testid="rest-proof-result">
        REST aprovado · {result.transport} → {result.source} · {result.scenario}
      </output>}
      <button className="rounded-md border px-4 py-2 text-sm focus-visible:outline-2" onClick={() => void verifySocket()} disabled={loading}>
        Executar prova Socket.IO
      </button>
      {socketResult && <output aria-live="polite" className="block rounded-md border p-4 text-sm" data-testid="socket-proof-result">
        Socket.IO aprovado · {socketResult}
      </output>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </main>
  )
}
