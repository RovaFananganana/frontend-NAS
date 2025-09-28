// composables/useBreadcrumb.js
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useBreadcrumb() {
  const route = useRoute()
  const router = useRouter()

  // Get breadcrumb items from current route
  const breadcrumbItems = computed(() => {
    if (route.meta.breadcrumb) {
      return route.meta.breadcrumb
    }
    
    // Fallback breadcrumb generation based on route path
    const pathSegments = route.path.split('/').filter(segment => segment)
    const items = [{ name: 'Accueil', path: '/user/dashboard' }]
    
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip the first 'user' segment as it's already covered by 'Accueil'
      if (segment === 'user') return
      
      // Map common segments to readable names
      const segmentNames = {
        'dashboard': 'Dashboard',
        'files': 'Mes fichiers',
        'storage': 'Stockage',
        'logs': 'Journal d\'activité',
        'profile': 'Mon profil'
      }
      
      const name = segmentNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      items.push({ name, path: currentPath })
    })
    
    return items
  })

  // Navigate to breadcrumb item
  const navigateTo = (path) => {
    router.push(path)
  }

  // Check if current route matches breadcrumb item
  const isCurrentRoute = (path) => {
    return route.path === path
  }

  return {
    breadcrumbItems,
    navigateTo,
    isCurrentRoute
  }
}