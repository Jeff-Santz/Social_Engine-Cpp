import { reactive } from 'vue'

// Singleton em nível de módulo: todos os componentes que chamarem useToast()
// compartilham o mesmo estado reativo — igual ao `toast` global único que
// existia dentro do setup() do index.html original.
const state = reactive({ show: false, message: '' })
let timeoutId = null

export function useToast() {
  const showToast = (message) => {
    state.message = message
    state.show = true
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      state.show = false
    }, 3000)
  }

  return { toast: state, showToast }
}
