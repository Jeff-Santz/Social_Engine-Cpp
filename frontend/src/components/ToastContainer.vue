<script setup>
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>

<template>
  <div v-if="toast.show" class="toast">{{ toast.message }}</div>
</template>
