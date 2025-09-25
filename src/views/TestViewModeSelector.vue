<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto py-8">
      <div class="tabs tabs-boxed mb-8 justify-center">
        <button 
          :class="['tab', { 'tab-active': activeTab === 'demo' }]"
          @click="activeTab = 'demo'"
        >
          Démonstration Simple
        </button>
        <button 
          :class="['tab', { 'tab-active': activeTab === 'test' }]"
          @click="activeTab = 'test'"
        >
          Tests Complets
        </button>
      </div>
      
      <ViewModeSelectorDemo v-if="activeTab === 'demo'" />
      <ViewModeSelectorTest v-else-if="activeTab === 'test'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ViewModeSelectorDemo from '../components/Examples/ViewModeSelectorDemo.vue'
import ViewModeSelectorTest from '../components/Examples/ViewModeSelectorTest.vue'

const activeTab = ref('demo')
</script>