<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Test du Modal.vue</h1>
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      @click="show = true"
    >
      Ouvrir le Modal
    </button>

    <Modal
      :visible="show"
      title="Exemple de Modal"
      show-confirm
      @close="show = false"
      @confirm="onConfirm"
    >
      <p class="mb-2">Ceci est un test du composant Modal.vue</p>
      <input
        v-model="message"
        placeholder="Écris quelque chose..."
        class="border p-2 w-full"
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from "vue"
import Modal from "@/components/Shared/Modal.vue"

const show = ref(false)
const message = ref("")

const onConfirm = () => {
  alert("Tu as écrit : " + message.value)
  show.value = false
}
</script>
