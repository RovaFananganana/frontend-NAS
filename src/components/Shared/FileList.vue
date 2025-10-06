<template>
  <div class="file-list-container">
    <table class="file-table">
      <thead>
        <tr>
          <th @click="sortBy('name')">
            Nom
            <span v-if="sortKey==='name'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
          </th>
          <th @click="sortBy('type')">
            Type
            <span v-if="sortKey==='type'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
          </th>
          <th @click="sortBy('size')">
            Taille
            <span v-if="sortKey==='size'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
          </th>
          <th @click="sortBy('modified')">
            Modifié le
            <span v-if="sortKey==='modified'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sortedItems" :key="item.id" @dblclick="openItem(item)">
          <td>{{ item.name }}</td>
          <td>{{ item.type }}</td>
          <td>{{ formatSize(item.size) }}</td>
          <td>{{ formatDate(item.modified) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  items: { type: Array, default: () => [] }
})
const emit = defineEmits(['open'])

const sortKey = ref('name')
const sortOrder = ref('asc')

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (sortKey.value === 'size') {
      valA = Number(valA)
      valB = Number(valB)
    }
    if (sortKey.value === 'modified') {
      valA = new Date(valA)
      valB = new Date(valB)
    }
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const openItem = (item) => emit('open', item)

const formatSize = (size) => {
  if (!size) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let s = size
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024
    i++
  }
  return `${s.toFixed(1)} ${units[i]}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.file-table {
  width: 100%;
  border-collapse: collapse;
}
.file-table th, .file-table td {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
  text-align: left;
  cursor: pointer;
}
.file-table th:hover {
  background-color: #f5f5f5;
}
.file-table tr:hover {
  background-color: #eef2f6;
}
</style>
