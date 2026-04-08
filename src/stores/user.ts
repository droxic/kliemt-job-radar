import { defineStore } from 'pinia'

import type { User } from './user.dto'
import { api, deleteAccessToken, storeAccessToken } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isDark: null as boolean | null,
  }),
  getters: {
    authenticated: (state) => state.user !== null,
    roles: (state) => state.user?.roles ?? [],
  },
  actions: {
    async login(username: string, password: string) {
      const { access_token, user } = await api.post<{
        access_token: string
        user: User
      }>('auth/login', { username, password })
      this.user = user
      storeAccessToken(access_token)
    },
    async loginWithToken(access_token: string) {
      storeAccessToken(access_token)
      await this.loadUser()
    },
   /*
      Not used in the SSO logout flow. Mutating store state here triggers
      $subscribe in App.vue, which redirects to /login before the browser
      can navigate to /api/sso/logout — re-logging the user in via the
      still-valid SSO session. Logout is handled entirely by redirecting
      to the server endpoint (see AuthLayout.vue).
    */
    async logout() {
      this.user = null
      deleteAccessToken()
    },
    async loadUser() {
      try {
        this.user = await api.get<User>('auth/profile')
      } catch (error) {
        console.error(error)
        this.user = null
        deleteAccessToken()
      }
    },
  },
  persist: {
    afterHydrate(ctx) {
      if (ctx.store.user) {
        // only load profile if we were logged before
        ctx.store.loadUser()
      }
    },
  },
})
