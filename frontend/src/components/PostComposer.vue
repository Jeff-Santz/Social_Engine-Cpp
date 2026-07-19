<script setup>
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { fileToBase64 } from '@/utils/file'

/**
 * Form de criar post, usado tanto no Feed quanto na página de Comunidade
 * (no original: reactive `newPost` e `newCommunityPost` bem separados —
 * aqui cada instância deste componente já tem seu próprio rascunho local,
 * então basta usar duas instâncias, uma por contexto).
 * `onSubmit` recebe (content, imageBase64) e deve devolver true/false —
 * exatamente a assinatura de postsStore.createPost / communitiesStore.createCommunityPost.
 */
const props = defineProps({
  onSubmit: { type: Function, required: true },
})

const { t } = useI18n()
const draft = reactive({ content: '', imageBase64: '', imagePreview: '' })

const handleImage = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const base64 = await fileToBase64(file)
  draft.imageBase64 = base64
  draft.imagePreview = base64
}

const clearImage = () => {
  draft.imageBase64 = ''
  draft.imagePreview = ''
}

const submit = async () => {
  const ok = await props.onSubmit(draft.content, draft.imageBase64)
  if (ok) {
    draft.content = ''
    draft.imageBase64 = ''
    draft.imagePreview = ''
  }
}
</script>

<template>
  <div class="card">
    <div class="form-group">
      <textarea v-model="draft.content" :placeholder="t('UI_WRITE_PLACEHOLDER')" maxlength="300"></textarea>
      <span class="char-counter" :class="{ warning: draft.content.length > 250, danger: draft.content.length > 290 }">
        {{ draft.content.length }}/300
      </span>
    </div>
    <div class="file-input-wrapper">
      <button class="btn-secondary">{{ t('UI_BTN_MEDIA') }}</button>
      <input type="file" accept="image/*" @change="handleImage" />
    </div>
    <img v-if="draft.imagePreview" :src="draft.imagePreview" class="image-preview" />
    <button v-if="draft.imagePreview" class="btn-secondary" @click="clearImage">{{ t('UI_BTN_DELETE') }}</button>
    <button class="btn-primary" @click="submit">{{ t('UI_BTN_SEND') }}</button>
  </div>
</template>
