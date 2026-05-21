import {
  createRouter,
  createWebHistory,
  type LocationQueryRaw,
  type RouteParams,
  type RouteRecordRaw,
} from 'vue-router'
import ProjectsView from '@/views/ProjectsView.vue'
import ProjectView from '@/views/ProjectView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import UnsupportedView from '@/views/UnsupportedView.vue'
import LoginCallbackView from '@/views/LoginCallbackView.vue'
import { useAuthStore } from '@/stores/user'

export enum AppRouteNames {
  HOME = 'home',
  LOGIN = 'login',
  PROJECT = 'project',
  PROJECTS = 'projects',
  CLIENTS = 'clients',
  HISTORY = 'history',
  LOGIN_CALLBACK = 'login-callback',
}

export enum AppLayouts {
  AUTH = 'auth',
  NO_AUTH = 'no-auth',
}

declare module 'vue-router' {
  interface RouteMeta {
    layout?: AppLayouts // Defaults to AppLayouts.AUTH
    noAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: AppRouteNames.HOME,
    redirect: { name: AppRouteNames.PROJECTS },
  },
  {
    path: `/${AppRouteNames.PROJECTS}`,
    children: [
      {
        path: ``,
        name: AppRouteNames.PROJECTS,
        component: ProjectsView,
      },
      {
        path: `:id`,
        name: AppRouteNames.PROJECT,
        component: ProjectView,
        props: true,
      },
    ],
  },
  {
    path: `/${AppRouteNames.CLIENTS}`,
    name: AppRouteNames.CLIENTS,
    component: UnsupportedView,
  },
  {
    path: `/${AppRouteNames.HISTORY}`,
    name: AppRouteNames.HISTORY,
    component: UnsupportedView,
  },
  {
    path: '/login',
    name: AppRouteNames.LOGIN,
    component: LoginView,
    meta: { layout: AppLayouts.NO_AUTH, noAuth: true },
  },
  {
    path: '/login-callback',
    name: AppRouteNames.LOGIN_CALLBACK,
    component: LoginCallbackView,
    meta: { layout: AppLayouts.NO_AUTH, noAuth: true },
  },
  {
    path: '/:pathRequesed(.*)*',
    component: NotFoundView,
    meta: { layout: AppLayouts.NO_AUTH },
  },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.noAuth) {
    return true
  }

  const authStore = useAuthStore()
  await authStore.ensureAuthValidated()

  if (!authStore.authenticated) {
    return { name: AppRouteNames.LOGIN }
  }

  return true
})

export function routerPush(
  name: AppRouteNames,
  params?: RouteParams,
  query?: LocationQueryRaw,
): ReturnType<typeof router.push> {
  return router.push({ name, params, query })
}

export default router
