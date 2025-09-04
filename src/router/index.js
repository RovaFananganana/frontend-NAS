import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import User from '../views/User.vue'
import store from '../store'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../components/Admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../components/Admin/UserManagement.vue')
      },
      {
        path: 'groups',
        name: 'GroupManagement',
        component: () => import('../components/Admin/GroupManagement.vue')
      },
      {
        path: 'files',
        name: 'FileExplorer',
        component: () => import('../components/Admin/FileExplorer.vue')
      },
      {
        path: 'logs',
        name: 'AccessLogs',
        component: () => import('../components/Admin/AccessLogs.vue')
      }
    ]
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'files',
        name: 'FileBrowser',
        component: () => import('../components/User/FileBrowser.vue')
      },
      {
        path: 'storage',
        name: 'StorageInfo',
        component: () => import('../components/User/StorageInfo.vue')
      },
      {
        path: 'activity',
        name: 'ActivityLogs',
        component: () => import('../components/User/ActivityLogs.vue')
      },
      {
        path: 'profile',
        name: 'ProfileEditor',
        component: () => import('../components/User/ProfileEditor.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.state.token) {
    next('/login')
  } else if (to.meta.requiresAdmin && !store.state.isAdmin) {
    next('/user/files')
  } else {
    next()
  }
})

export default router