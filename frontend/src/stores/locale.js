import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { i18n, LANG_CODE_TO_LOCALE, DEFAULT_LANG_CODE } from '@/i18n'

/**
 * Idioma ativo (PT-BR/EN-US) + dados geográficos (estados/cidades), que o
 * backend devolve já traduzidos conforme o idioma setado no servidor.
 * Port dos blocos "--- TRANSLATION HELPER ---", "--- GEOGRAPHIC DATA ---" e
 * "--- LANGUAGE ---" do index.html original.
 *
 * Nota: /api/translations e /api/language operam sobre um singleton GLOBAL
 * no servidor (Core::Translation), não por sessão/usuário — isso já era
 * assim no backend original e foi só preservado, não é bug introduzido aqui.
 */
export const useLocaleStore = defineStore('locale', () => {
  const currentLang = ref(DEFAULT_LANG_CODE) // 1 = PT-BR, 0 = EN-US (igual ao original)
  const serverStates = ref([])
  const serverCities = ref([])

  const loadTranslations = async () => {
    const { apiFetch } = useApi()
    try {
      const dict = await apiFetch('/api/translations')
      const localeKey = LANG_CODE_TO_LOCALE[currentLang.value]
      i18n.global.setLocaleMessage(localeKey, dict)
      i18n.global.locale.value = localeKey
    } catch (e) {
      // Silencioso, igual ao original (catch vazio).
    }
  }

  const loadStates = async () => {
    const { apiFetch } = useApi()
    try {
      serverStates.value = await apiFetch('/api/states')
    } catch (e) {
      // Silencioso, igual ao original.
    }
  }

  const loadCities = async (state) => {
    if (!state) return
    const { apiFetch } = useApi()
    try {
      serverCities.value = await apiFetch(`/api/cities/${state}`)
    } catch (e) {
      // Silencioso, igual ao original.
    }
  }

  // Troca o idioma no singleton do servidor (POST /api/language) e recarrega
  // traduções + estados. Quem tiver um form de cadastro aberto (AuthView)
  // observa `currentLang` e limpa a própria seleção de estado/cidade.
  const setLanguage = async (langCode) => {
    const { apiFetch } = useApi()
    currentLang.value = langCode
    try {
      await apiFetch('/api/language', {
        method: 'POST',
        body: JSON.stringify({ lang: langCode }),
      })
      localStorage.setItem('user_lang', langCode)
      await loadTranslations()
      await loadStates()
      serverCities.value = []
    } catch (e) {
      console.error(e)
    }
  }

  // Bootstrap chamado no onMounted do App.vue (equivalente ao trecho inicial
  // do onMounted original, antes do checkAuth()).
  const init = async () => {
    await loadTranslations()
    await loadStates()
    const savedLang = localStorage.getItem('user_lang')
    const initialLang = savedLang !== null ? parseInt(savedLang) : DEFAULT_LANG_CODE
    await setLanguage(initialLang)
  }

  return {
    currentLang, serverStates, serverCities,
    loadTranslations, loadStates, loadCities, setLanguage, init,
  }
})
