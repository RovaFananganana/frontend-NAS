// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '../services/auth'

// Import des vues
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import User from '../views/User.vue'
import NotFound from '../views/NotFound.vue'
import TestModal from '../views/TestModal.vue'
import TestViewModeSelector from '../views/TestViewModeSelector.vue'
import TestTreeView from '../views/TestTreeView.vue'
import TestDetailedListView from '../views/TestDetailedListView.vue'
import TestFileExplorer from '../views/TestFileExplorer.vue'
import TestMultipleSelection from '../views/TestMultipleSelection.vue'
import FormattingUtilsDemo from '../components/Demo/FormattingUtilsDemo.vue'
import FileOperationsExample from '../components/Examples/FileOperationsExample.vue'

const routes = [
   { path: "/test-modal", component: TestModal },
   { path: "/test-view-mode-selector", component: TestViewModeSelector },
   { path: "/test-tree-view", component: TestTreeView },
   { path: "/test-detailed-list-view", component: TestDetailedListView },
   { path: "/test-file-explorer", component: TestFileExplorer },
   { path: "/test-multiple-selection", component: TestMultipleSelection },
   { path: "/test-formatting-utils", component: FormattingUtilsDemo },
   { path: "/test-file-operations", component: FileOperationsExample },
  {
    path: '/',
    redirect: to => {
      if (!isAuthenticated()) {
        return '/login'
      }
      return isAdmin() ? '/admin' : '/user'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      hideForAuthenticated: true
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/user',
    name: 'User', 
    component: User,
    meta: { 
      requiresAuth: true,
      requiresAdmin: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()
  const isUserAdmin = isAdmin()

  // Rediriger les utilisateurs connectés loin de la page de login
  if (to.meta.hideForAuthenticated && authenticated) {
    next(isUserAdmin ? '/admin' : '/user')
    return
  }

  // Vérifier l'authentification
  if (to.meta.requiresAuth && !authenticated) {
    next('/login')
    return
  }

  // Vérifier les permissions admin
  if (to.meta.requiresAdmin && !isUserAdmin) {
    next('/user')
    return
  }

  // Rediriger les admins vers la bonne interface
  if (to.path === '/user' && isUserAdmin) {
    next('/admin')
    return
  }

  // Rediriger les utilisateurs simples vers la bonne interface
  if (to.path === '/admin' && authenticated && !isUserAdmin) {
    next('/user')
    return
  }

  next()
})

export default router