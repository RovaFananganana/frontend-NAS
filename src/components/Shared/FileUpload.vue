<template>
  <div class="p-4 bg-base-200 rounded-lg">
    <h3 v-if="title" class="text-lg font-semibold mb-2">{{ title }}</h3>
    <form @submit.prevent="uploadFile" class="flex items-center gap-2">
      <input 
        type="file" 
        @change="handleFileChange"
        class="file-input file-input-bordered file-input-primary w-full max-w-xs"
        :multiple="multiple"
      />
      <button 
        type="submit" 
        class="btn btn-primary"
        :disabled="loading || !selectedFiles.length"
      >
        {{ loading ? "Envoi..." : buttonText }}
      </button>
    </form>

    <p v-if="message" class="mt-2 text-sm text-success">{{ message }}</p>
    <p v-if="error" class="mt-2 text-sm text-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { userAPI, adminAPI } from "@/services/api";

const emit = defineEmits(["uploaded"]);

const props = defineProps({
  ownerType: { type: String, default: "user" }, // "user" ou "admin"
  ownerId: { type: Number, default: null },     // requis si ownerType=admin
  title: { type: String, default: "Uploader un fichier" },
  buttonText: { type: String, default: "Uploader" },
  multiple: { type: Boolean, default: false },
});

const selectedFiles = ref([]);
const loading = ref(false);
const message = ref("");
const error = ref("");

const handleFileChange = (e) => {
  selectedFiles.value = Array.from(e.target.files);
  message.value = "";
  error.value = "";
};

const uploadFile = async () => {
  if (!selectedFiles.value.length) return;
  loading.value = true;
  message.value = "";
  error.value = "";

  try {
    for (const file of selectedFiles.value) {
      const formData = new FormData();
      formData.append("file", file);

      if (props.ownerType === "admin") {
        if (!props.ownerId) {
          error.value = "ownerId requis pour l'admin";
          loading.value = false;
          return;
        }
        formData.append("owner_id", props.ownerId);
        await adminAPI.uploadFile(formData);
      } else {
        await userAPI.uploadFile(formData);
      }
    }

    message.value = "Fichier(s) uploadé(s) avec succès ✅";
    emit("uploaded");
    selectedFiles.value = [];
  } catch (err) {
    error.value = err.response?.data?.message || "Erreur lors de l'upload ❌";
  } finally {
    loading.value = false;
  }
};
</script>
