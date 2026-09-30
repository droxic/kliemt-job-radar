<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import KliemtLogo from '@/components/KliemtLogo.vue'
import { AppRouteNames } from '@/router'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const sidebarOpen = ref(false)
const isDark = ref(false)

const theme = localStorage.getItem('theme') ?? 'auto'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const setThemeOnQuery = () => {
  isDark.value = darkQuery.matches
}
if (theme == 'auto') {
  setThemeOnQuery()
  darkQuery.addEventListener('change', setThemeOnQuery)
} else {
  isDark.value = theme == 'dark'
}
function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  darkQuery.removeEventListener('change', setThemeOnQuery)
}
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
function closeSidebar() {
  sidebarOpen.value = false
}
const darkThemeClass = 'theme-dark'
const bodyClass = 'layout-auth'
onMounted(() => {
  document.body.classList.add(bodyClass)
  if (isDark.value) {
    document.body.classList.add(darkThemeClass)
  }
})
onUnmounted(() => {
  document.body.classList.remove(bodyClass)
})

watch(isDark, (isDark) => {
  if (isDark) {
    document.body.classList.add(darkThemeClass)
  } else {
    document.body.classList.remove(darkThemeClass)
  }
})

const router = useRouter()
const logoutReturnRoute = router.resolve({ name: AppRouteNames.HOME })
const logoutReturnUrl = new URL(logoutReturnRoute.href, window.location.origin).href

function logout() {
  localStorage.removeItem('access_token')
  const params = new URLSearchParams({
    redirect_uri: logoutReturnUrl,
  })
  window.location.href = `/api/sso/logout?${params.toString()}`
}

const profileUrl = computed(() => {
  return `${import.meta.env.VITE_SST_URL}/profile`
})
</script>

<template>
  <header>
    <button :class="['burger', { '--open': sidebarOpen }]" @click="toggleSidebar">
      <IMaterialSymbolsMenuRounded />
    </button>
    <KliemtLogo class="header-logo" />
    <ul class="header-nav" role="navigation">
      <li><a href="/sst">Social Selection Tool</a></li>
      <li><a href="/rbi">Restructuring Budget Indicator</a></li>
      <li><a href="/vlt">Voluntary Leaver Tool</a></li>
      <li><a href="/spe">Social Plan Estimator</a></li>
      <li><a href="/job-radar" class="active">Job Radar</a></li>
    </ul>
    <button class="theme-switch btn" role="switch" title="Theme" @click="toggleTheme">
      <IMdiWhiteBalanceSunny v-if="!isDark" />
      <IMdiMoonWaxingCrescent v-else />
    </button>
    <a class="btn" :href="profileUrl" :title="$t('Account')">
      <IMaterialSymbolsAccountCircleOutline />
    </a>
    <button class="btn" :title="$t('Logout')" @click="logout">
      <IMdiLogout />
    </button>
    <a class="btn header-apps" title="Home" href="/">
      <IMdiApps />
    </a>
  </header>
  <aside :class="['sidebar', { '--open': sidebarOpen }]">
    <nav class="sidebar-nav">
      <RouterLink
        :to="{ name: AppRouteNames.PROJECTS }"
        @click="closeSidebar"
        class="sidebar-nav-item"
      >
        <span class="sidebar-icon-holder">
          <IMaterialSymbolsTravelExploreRounded />
        </span>
        Job Radar
      </RouterLink>
      <a class="sidebar-nav-item --split" title="Home" href="/">
        <span class="sidebar-icon-holder">
          <IMdiApps />
        </span>
        {{ $t('Home') }}
      </a>
    </nav>
  </aside>

  <main>
    <slot />
  </main>
</template>

<style>
header {
  height: var(--header-height);
  position: fixed;
  z-index: 3;
  display: flex;
  align-items: center;
  top: 0;
  left: 0;
  right: 0;
  background: var(--color-background);
  box-shadow: 0 0 0.5rem #00000055;
  padding-right: 0.5rem;
}

.burger {
  font-size: 1.2rem;
  width: var(--header-height);
  align-self: stretch;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
}
.burger svg {
  transition: transform 0.3s;
}
.burger:not(.--open) svg {
  transform: rotate(-90deg);
}
@media (hover: hover) {
  .burger:hover {
    color: var(--color-kliemt);
  }
}
.header-logo {
  height: 2rem;
}
.header-nav {
  margin-left: 1rem;
  padding: 0;
  display: flex;
  list-style: none;

  & li {
    margin: 0;
    padding: 0;

    &:has(.active) {
      border-radius: var(--border-radius);
      background-color: color-mix(in srgb, var(--color-kliemt) 10%, transparent);
    }
  }
  & a {
    display: block;
    color: inherit;
    text-decoration: none;
    padding: 0.5em 1em;

    &.active {
      color: var(--color-kliemt);
    }
  }
  @media (max-width: 1200px) {
    display: none;
  }
}
.header-app {
  margin-left: 1rem;
  display: inline-block;
  background-color: var(--color-kliemt);
  height: 2.5rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  margin-right: 1rem;
  font-size: 1.3rem;
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-apps {
  display: none;

  @media (max-width: 1200px) {
    display: inline-block;
  }
}

.sidebar {
  position: fixed;
  z-index: 3;
  top: var(--header-height);
  width: var(--header-height);
  bottom: 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  transition:
    width 0.3s,
    box-shadow 0.3s;
}
.sidebar::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 0;
  bottom: 0;
  width: 0.3rem;
  background: linear-gradient(to right, #00000022, #00000000);
  pointer-events: none;
}
.sidebar.--open {
  width: 10rem;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem 0;
  width: 100%;
  height: 100%;
}
.sidebar-nav-item {
  white-space: nowrap;
  display: flex;
  align-items: center;
  position: relative;
  text-decoration: none;
  color: var(--color-text);
  cursor: pointer;
}
.sidebar-nav-item::before {
  content: '';
  position: absolute;
  background: var(--color-kliemt);
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 0 0.5rem 0.5rem 0;
  width: 0.25rem;
  height: 0;
  transition: height 0.3s;
}
.sidebar-nav-item.router-link-active {
  color: var(--color-kliemt);
}
.sidebar-nav-item.router-link-active::before {
  height: 1.5rem;
}
.sidebar-nav-item.--split {
  margin-top: auto;
}
@media (hover: hover) {
  .sidebar-nav-item:hover {
    color: var(--color-kliemt);
  }
  .sidebar-nav-item:hover::before {
    height: 2.2rem;
  }
}
.sidebar-icon-holder {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--header-height);
  height: 2.5rem;
  font-size: 1.25rem;
}

.layout-auth main {
  margin-top: var(--header-height);
  margin-left: var(--header-height);
  min-height: calc(100vh - var(--header-height));
  padding: 16px;
  background: var(--color-background-accent);
}

.theme-switch {
  margin-left: auto;
}
</style>
