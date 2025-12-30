import { useEffect, useState } from 'react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'

type CreateSessionResponse = {
  sessionId: string
}

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createLivenessSession() {
    setLoading(true)
    setError(null)
    try {
      // Seu backend deve criar a sessão no Rekognition e retornar sessionId
      // Ex: POST /api/liveness/session
      const res = await fetch('/api/liveness/session', { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao criar sessão de liveness')
      const data = (await res.json()) as CreateSessionResponse
      setSessionId(data.sessionId)
    } catch (e: any) {
      setError(e?.message ?? 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    createLivenessSession()
  }, [])

  if (loading && !sessionId) return <p>Preparando câmera e sessão…</p>
  if (error) return (
    <div>
      <p>Erro: {error}</p>
      <button onClick={createLivenessSession}>Tentar de novo</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <h2>Validação Facial (Liveness)</h2>

      {sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region={amplifyRegionFromConfig()}
          onAnalysisComplete={() => {
            // Aqui você geralmente chama seu backend para buscar o resultado da sessão
            // Ex: GET /api/liveness/result?sessionId=...
            console.log('Análise concluída')
          }}
          onError={(err) => {
            console.error(err)
            setError('Falha no fluxo de liveness')
          }}
        />
      ) : (
        <button onClick={createLivenessSession}>Iniciar validação</button>
      )}
    </div>
  )
}

/**
 * Dica: o region pode vir do seu amplifyconfiguration.json dependendo do setup.
 * Se preferir, substitua por uma string fixa: "us-east-1", etc.
 */
function amplifyRegionFromConfig(): string {
  // Ajuste conforme seu arquivo; se não souber, use a região fixa.
  return 'us-east-1'
}
