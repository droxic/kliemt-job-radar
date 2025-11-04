<script setup lang="ts">
import { AppRouteNames, routerPush } from '@/router'
import { useAuthStore } from '@/stores/user'
import { reactive, ref, useTemplateRef } from 'vue'

const formRef = useTemplateRef('formRef')
const form = reactive({
  user: '',
  pass: '',
})
const errors = ref()
const authStore = useAuthStore()

async function login() {
  errors.value = {}

  if (!formRef.value?.checkValidity()) return

  try {
    await authStore.login(form.user, form.pass)
    await routerPush(AppRouteNames.HOME)
  } catch (error) {
    errors.value = error
    console.error(error)
  }
}
const forgotUrl = `${import.meta.env.VITE_SST_URL}/forgot-password`
</script>

<template>
  <form ref="formRef" class="login-form" aria-label="Login form" @submit.prevent="login">
    <input
      class="input"
      v-model="form.user"
      type="email"
      :aria-label="$t('Username')"
      required
      :placeholder="$t('Username')"
    />
    <input
      class="input"
      v-model="form.pass"
      type="password"
      :aria-label="$t('Password')"
      required
      :placeholder="$t('Password')"
    />
    <button class="btn --primary --pill" :disabled="!form.user || !form.pass" type="submit">
      {{ $t('Login') }}
    </button>
    <p>
      <a :href="forgotUrl">{{ $t('Forgot your password?') }}</a>
    </p>
  </form>
</template>

<style>
.login-form {
  max-width: 20rem;
  padding: 2.2rem 3.2rem;
  border: 1px solid var(--color-kliemt);
  background: var(--color-background);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.05);
}
.login-form input {
  padding: 0.5rem;
  margin: 0.5rem 0;
}
.login-form .btn {
  font-weight: bold;
  padding: 0.5rem 3rem;
  margin-top: 1rem;
  text-transform: uppercase;
}
</style>
