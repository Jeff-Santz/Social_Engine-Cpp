import { useAuthStore } from '@/stores/auth'

// Mesma URL hardcoded do index.html original, agora configurável via
// VITE_API_BASE (.env) — a variável API_BASE continua existindo em espírito,
// só passa a vir do ambiente em vez de estar fixa no código-fonte.
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://unrodded-florencia-unkemptly.ngrok-free.dev'

/**
 * Composable que encapsula o antigo helper `api()` do index.html original.
 * Mesmo contrato: endpoint relativo (ex: '/api/login'), injeta o header
 * Authorization: Bearer <token> quando há sessão, mantém o header
 * 'ngrok-skip-browser-warning' (necessário para o túnel ngrok de dev),
 * faz parse de JSON com fallback pra texto puro, e lança erro em respostas
 * não-OK usando a mensagem do backend quando disponível.
 */
export function useApi() {
  const apiFetch = async (endpoint, options = {}) => {
    const authStore = useAuthStore()
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    }
    if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
      if (!res.ok) {
        throw new Error(typeof data === 'string' ? data : data.message || 'Error')
      }
      return data
    } catch (err) {
      console.error('API Error:', err)
      throw err
    }
  }

  return { apiFetch, API_BASE }
}
