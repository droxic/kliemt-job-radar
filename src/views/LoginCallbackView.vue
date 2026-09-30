<script setup lang="ts">
import { api } from '@/api'
import { AppRouteNames, routerPush } from '@/router';
import { useAuthStore } from '@/stores/user';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const loginCallbackRoute = router.resolve({name:AppRouteNames.LOGIN_CALLBACK})
const loginCallbackUrl = new URL(loginCallbackRoute.href, window.location.origin).href

const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')

const authStore = useAuthStore()

const status = ref('Please wait...')

const codeVerifier = sessionStorage.getItem('code_verifier_job_radar');

if (!code || !codeVerifier) {
  // Missing code or verifier — restart login flow
  sessionStorage.removeItem('code_verifier_job_radar')
  routerPush(AppRouteNames.LOGIN)
} else {
  try {
    const { access_token } = await api.post<{access_token: string}>('sso/token', {
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
      redirect_uri: loginCallbackUrl,
      code,
      code_verifier: codeVerifier,
    });

    sessionStorage.removeItem('code_verifier_job_radar')
    await authStore.loginWithToken(access_token);
    routerPush(AppRouteNames.HOME)
  } catch (error) {
    sessionStorage.removeItem('code_verifier_job_radar')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (error as any).body?.message ?? 'Something went wrong.'
    console.error('SSO token exchange failed:', message)
    // Redirect back to login to start a fresh PKCE flow
    status.value = `${message} Redirecting to login...`
    setTimeout(() => routerPush(AppRouteNames.LOGIN), 2000)
  }
}
</script>
<template>
  {{ status }}
</template>
