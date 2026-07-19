<script setup>
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()

const onChange = (e) => {
  localeStore.setLanguage(parseInt(e.target.value))
}
</script>

<template>
  <div style="position: fixed; bottom: 20px; right: 20px; z-index: 999">
    <select :value="localeStore.currentLang" style="font-size: 12px; padding: 4px 8px" @change="onChange">
      <option :value="1">PT-BR</option>
      <option :value="0">EN-US</option>
    </select>
  </div>
</template>
