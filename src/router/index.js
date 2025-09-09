// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '../services/auth'

// Import des vues
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import User from '../views/User.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
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