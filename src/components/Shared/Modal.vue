<template>
  <div
    v-if="visible"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div
      class="bg-white rounded-lg shadow-lg w-96 max-w-full p-6 relative animate-fade-in"
    >
      <!-- Bouton fermer -->
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        @click="close"
      >
        ✕
      </button>

      <!-- Titre -->
      <h2 v-if="title" class="text-lg font-semibold mb-4">{{ title }}</h2>

      <!-- Contenu -->
      <div class="mb-4">
        <slot />
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2">
        <button
          v-if="showCancel"
          class="px-3 py-2 rounded border hover:bg-gray-100"
          @click="close"
        >
          Annuler
        </button>
        <button
          v-if="showConfirm"
          class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          @click="$emit('confirm')"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: "" },
  showCancel: { type: Boolean, default: true },
  showConfirm: { type: Boolean, default: false },
})

const emit = defineEmits(["close", "confirm"])

const close = () => {
  emit("close")
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
