<script setup lang="ts">
import pkceChallenge from 'pkce-challenge'
import LoginForm from '../components/LoginForm.vue'
import { useAuthStore } from '@/stores/user'
import { AppRouteNames, routerPush } from '@/router'
import { api } from '@/api'
import { useRouter } from 'vue-router'
const authStore = useAuthStore()
if (authStore.authenticated) {
  routerPush(AppRouteNames.HOME)
}

const router = useRouter()
const loginCallbackRoute = router.resolve({name:AppRouteNames.LOGIN_CALLBACK})
const loginCallbackUrl = new URL(loginCallbackRoute.href, window.location.origin).href;

const { code_verifier, code_challenge } = await pkceChallenge()
sessionStorage.setItem('code_verifier', code_verifier)

const params = new URLSearchParams({
  client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
  redirect_uri: loginCallbackUrl,
  response_type: 'code',
  code_challenge,
  code_challenge_method: 'S256',
})

window.location.href = `/api/sso/login?${params.toString()}`
</script>

<template>
  Please wait ...
  <!-- <LoginForm /> -->
</template>
