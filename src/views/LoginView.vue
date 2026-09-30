<script setup lang="ts">
import pkceChallenge from 'pkce-challenge'
import { useAuthStore } from '@/stores/user'
import { AppRouteNames, routerPush } from '@/router'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const authStore = useAuthStore()

const router = useRouter()

onMounted(async () => {
  await authStore.ensureAuthValidated()
  if (authStore.authenticated) {
    routerPush(AppRouteNames.HOME)
    return
  }

  const loginCallbackRoute = router.resolve({name:AppRouteNames.LOGIN_CALLBACK})
  const loginCallbackUrl = new URL(loginCallbackRoute.href, window.location.origin).href

  const { code_verifier, code_challenge } = await pkceChallenge()
  sessionStorage.setItem('code_verifier_job_radar', code_verifier)

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
    redirect_uri: loginCallbackUrl,
    response_type: 'code',
    code_challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `/api/sso/login?${params.toString()}`
})
</script>

<template>
  Please wait ...
  <!-- <LoginForm /> -->
</template>
