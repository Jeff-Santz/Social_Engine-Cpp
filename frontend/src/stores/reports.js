import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/i18n'

/**
 * Modal de denúncia (submissão), acionável a partir de qualquer view
 * (posts/comentários no Feed, usuários no Profile). Distinta de adminStore,
 * que é o painel de moderação (só o admin usa). Port do bloco
 * "--- REPORTS ---" do index.html original.
 */
export const useReportsStore = defineStore('reports', () => {
  const showModal = ref(false)
  const form = reactive({ targetId: null, type: '', category: '', reason: '' })

  const open = (type, targetId) => {
    form.targetId = targetId
    form.type = type
    form.category = ''
    form.reason = ''
    showModal.value = true
  }

  const close = () => {
    showModal.value = false
  }

  const submit = async () => {
    if (!form.category) {
      alert(i18n.global.t('ERR_MISSING'))
      return
    }
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          target_id: form.targetId,
          target_type: form.type,
          category: form.category,
          reason: form.reason,
        }),
      })
      showModal.value = false
      showToast(i18n.global.t('MSG_REPORT_CREATED'))
    } catch (e) {
      alert(e.message || 'Failed to submit report')
    }
  }

  return { showModal, form, open, close, submit }
})
