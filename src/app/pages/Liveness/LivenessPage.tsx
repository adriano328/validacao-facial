import { useEffect, useRef, useState } from 'react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'

type CreateSessionResponse = {
    sessionId: string
}

export default function LivenessPage() {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Evita criar a sessão duas vezes (React StrictMode)
    const sessionRequestedRef = useRef(false)

    async function createLivenessSession() {
        if (sessionRequestedRef.current) return
        sessionRequestedRef.current = true

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(
                'http://85.31.63.50:1030/liveness/criar-sessao',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (!res.ok) {
                throw new Error('Falha ao criar sessão de liveness')
            }

            const data = (await res.json()) as CreateSessionResponse

            if (!data.sessionId) {
                throw new Error('sessionId não retornado pela API')
            }

            setSessionId(data.sessionId)
        } catch (err: any) {
            console.error(err)
            setError(err?.message ?? 'Erro desconhecido')
            sessionRequestedRef.current = false
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        createLivenessSession()
    }, [])

    if (loading && !sessionId) {
        return (
            <p style={{ textAlign: 'center', marginTop: 40 }}>
                Preparando câmera e sessão de validação facial…
            </p>
        )
    }

    if (error) {
        return (
            <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
                <p>{error}</p>
                <button
                    onClick={() => {
                        sessionRequestedRef.current = false
                        setSessionId(null)
                        createLivenessSession()
                    }}
                >
                    Tentar novamente
                </button>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 520, margin: '40px auto' }}>
            <h2>Validação Facial (Liveness)</h2>

            {sessionId ? (
                <FaceLivenessDetector
                    sessionId={sessionId}
                    region="us-east-1"
                    onAnalysisComplete={async () => {
                        console.log('✅ Análise de liveness concluída')
                    }}
                    onError={(err: any) => {
                        console.error('Erro no FaceLivenessDetector:', err)

                        if (err?.state === 'MOBILE_LANDSCAPE_ERROR') {
                            setError(
                                'Use o celular em modo retrato (vertical) para continuar.'
                            )
                            return
                        }

                        setError('Falha durante a validação facial')
                    }}
                />
            ) : (
                <button onClick={createLivenessSession}>
                    Iniciar validação facial
                </button>
            )}
        </div>
    )
}