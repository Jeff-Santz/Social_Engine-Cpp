import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/i18n'

/**
 * Painel administrativo: listar e resolver denúncias.
 * Port do bloco "--- ADMIN ---" do index.html original.
 *
 * O backend já valida server-side que só o usuário id=1 acessa
 * /api/admin/reports (retorna 403 pra qualquer outro) — a UI só esconde a
 * aba "Admin" pra quem não é id=1 (AdminView.vue / NavBar.vue), replicando
 * exatamente o mesmo modelo de segurança do original (proteção real é no
 * backend, o front só evita mostrar um link inútil).
 */
export const useAdminStore = defineStore('admin', () => {
  const reports = ref([])
  const loading = ref(false)

  const loadReports = async () => {
    const { apiFetch } = useApi()
    loading.value = true
    try {
      reports.value = await apiFetch('/api/admin/reports')
    } catch (e) {
      console.error('Failed to load reports:', e)
      reports.value = []
    } finally {
      loading.value = false
    }
  }

  const resolveReport = async (reportId, action) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/admin/reports/resolve', {
        method: 'POST',
        body: JSON.stringify({ report_id: reportId, action }),
      })
      await loadReports()
      showToast(i18n.global.t('MSG_REPORT_RESOLVED'))
    } catch (e) {
      alert(e.message || 'Failed to resolve report')
    }
  }

  return { reports, loading, loadReports, resolveReport }
})
