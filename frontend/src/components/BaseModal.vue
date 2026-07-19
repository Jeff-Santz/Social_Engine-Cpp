<script setup>
// Wrapper genérico de modal (overlay + card), usado por ReportModal,
// EditProfileModal, EditCommunityModal e SignupSuccessModal — antes cada um
// desses repetia a mesma div.modal-overlay/div.modal no index.html original.
defineProps({
  show: { type: Boolean, default: true },
})
defineEmits(['close'])
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <slot />
    </div>
  </div>
</template>
