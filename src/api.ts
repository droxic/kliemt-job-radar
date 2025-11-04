import { mande } from 'mande'

export const api = mande('/api')

const stored_token = localStorage.getItem('access_token')
if (stored_token) {
  api.options.headers.Authorization = 'Bearer ' + stored_token
}

export function storeAccessToken(access_token: string) {
  api.options.headers.Authorization = 'Bearer ' + access_token
  localStorage.setItem('access_token', access_token)
}

export function deleteAccessToken() {
  api.options.headers.Authorization = null
  localStorage.removeItem('access_token')
}
