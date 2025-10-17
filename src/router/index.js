// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '../services/auth'

// Import des vues
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import User from '../views/User.vue'
import NotFound from '../views/NotFound.vue'
import ForceLogin from '../components/Debug/ForceLogin.vue'

import FormattingUtilsDemo from '../components/Demo/FormattingUtilsDemo.vue'
import FileOperationsExample from '../components/Examples/FileOperationsExample.vue'

const routes = [
  {
    path: '/',
    redirect: to => {
      const authenticated = isAuthenticated()
      const userIsAdmin = isAdmin()
      
      console.log('🏠 Root redirect logic:', {
        authenticated,
        userIsAdmin,
        redirectTo: !authenticated ? '/login' : (userIsAdmin ? '/admin' : '/user')
      })
      
      if (!authenticated) {
        return '/login'
      }
      return userIsAdmin ? '/admin' : '/user'
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
    path: '/force-login',
    name: 'ForceLogin',
    component: ForceLogin,
    meta: { 
      requiresAuth: false
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
  
  console.log('🧭 Router navigation:', {
    to: to.path,
    from: from.path,
    authenticated,
    isUserAdmin,
    toMeta: to.meta
  })

  // Rediriger les utilisateurs connectés loin de la page de login
  if (to.meta.hideForAuthenticated && authenticated) {
    console.log('🔄 Redirecting authenticated user away from login')
    next(isUserAdmin ? '/admin' : '/user')
    return
  }

  // Vérifier l'authentification
  if (to.meta.requiresAuth && !authenticated) {
    console.log('🔒 Redirecting unauthenticated user to login')
    next('/login')
    return
  }

  // Vérifier les permissions admin
  if (to.meta.requiresAdmin && !isUserAdmin) {
    console.log('👤 Redirecting non-admin to user area')
    next('/user')
    return
  }

  // Rediriger les admins vers la bonne interface
  if (to.path === '/user' && isUserAdmin) {
    console.log('👑 Redirecting admin to admin area')
    next('/admin')
    return
  }

  // Rediriger les utilisateurs simples vers la bonne interface
  if (to.path === '/admin' && authenticated && !isUserAdmin) {
    console.log('👤 Redirecting user to user area')
    next('/user')
    return
  }

  console.log('✅ Navigation allowed')
  next()
})

export default router