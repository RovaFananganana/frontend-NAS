<template>
  <div class="flex h-screen bg-gray-100">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main class="flex-1 overflow-x-hidden overflow-y-auto">
        <div class="container mx-auto px-6 py-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import Navbar from '../components/Shared/Navbar.vue'
import Sidebar from '../components/Shared/Sidebar.vue'

export default {
  name: 'User',
  components: {
    Navbar,
    Sidebar
  }
}
</script>