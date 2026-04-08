<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from './views/layouts/AuthLayout.vue'
import NoAuthLayout from './views/layouts/NoAuthLayout.vue'
import { AppLayouts, AppRouteNames, routerPush } from './router'
import { useAuthStore } from './stores/user'

const router = useRouter();
const route = useRoute()

const layout = computed(() => {
  switch (route.matched[0]?.meta.layout) {
    case AppLayouts.NO_AUTH:
      return NoAuthLayout
    default:
      return AuthLayout
  }
})

const authStore = useAuthStore()

let checkingAuth = false
async function checkAuth() {
  if (checkingAuth) return
  checkingAuth = true
  try {
    await router.isReady();
    if (!authStore.authenticated && !route.matched[0]?.meta.noAuth) {
      routerPush(AppRouteNames.LOGIN)
    }
  } finally {
    checkingAuth = false
  }
}
checkAuth()

const { locale } = useI18n({ useScope: 'global' })
const setLocale = () => {
  locale.value = authStore.user?.language ?? navigator.language.split('-')[0]
  document.documentElement.setAttribute('lang', locale.value)
}
setLocale()
authStore.$subscribe(() => {
  checkAuth()
  setLocale()
})
</script>

<template>
  <Component :is="layout">
    <RouterView v-slot="{ Component }">
      <template v-if="Component">
        <Suspense>
          <!-- main content -->
          <component :is="Component"></component>

          <!-- loading state -->
          <template #fallback> Loading... </template>
        </Suspense>
      </template>
    </RouterView>
  </Component>
</template>
