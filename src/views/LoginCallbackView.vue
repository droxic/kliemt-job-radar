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

try {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  const { access_token } = await api.post<{access_token: string}>('sso/token', {
    grant_type: 'authorization_code',
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
    redirect_uri: loginCallbackUrl,
    code,
    code_verifier: codeVerifier,
  });

  await authStore.loginWithToken(access_token);
  sessionStorage.removeItem('code_verifier');
  routerPush(AppRouteNames.HOME)
} catch (error) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status.value = (error as any).body?.message ?? 'Somethnig went wrong. Please retry.'
}
</script>
<template>
  {{ status }}
</template>
