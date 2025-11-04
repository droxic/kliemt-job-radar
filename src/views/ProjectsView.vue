<script setup lang="ts">
import CreateProject from '@/components/CreateProject.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { AppRouteNames } from '@/router'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/user'
import { useTemplateRef, computed, ref } from 'vue'

const modalRef = useTemplateRef('modalRef')

const authStore = useAuthStore()

const projectsStore = useProjectsStore()
const search = ref('')
const projects = computed(() => projectsStore.projects)
await projectsStore.loadProjects()

const projectFiltered = computed(() => {
  return projects.value.filter((project) => {
    const clientNames = project.clients
      .map(({ company_name }) => company_name.toLocaleLowerCase())
      .join()
    return (
      project.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) ||
      clientNames.includes(search.value.toLocaleLowerCase())
    )
  })
})
</script>

<template>
  <div class="p-project-list-head">
    <input
      class="input"
      type="search"
      v-model="search"
      :placeholder="$t('Search')"
      aria-label="Search"
    />
    <button
      class="btn --primary --pill"
      @click="modalRef?.show"
      :disabled="!authStore.roles.includes('lawyer')"
    >
      {{ $t('Create Project') }}
    </button>
  </div>
  <div class="p-project-list">
    <div v-if="projects.length == 0" class="p-project-list-item">
      {{ $t('There are no projects available. You can create one.') }}
    </div>
    <div v-else-if="projectFiltered.length == 0" class="p-project-list-item">
      {{ $t('No projects found, adjust your serch criteria') }}
    </div>
    <template v-else>
      <RouterLink
        :to="{ name: AppRouteNames.PROJECT, params: { id: project.id } }"
        v-for="project in projectFiltered"
        :key="project.id"
        class="p-project-list-item"
      >
        <strong>{{ project.title }}</strong>
        <span v-if="project.clients.length">
          • {{ project.clients.map(({ company_name }) => company_name).join(', ') }}
        </span>
        <span class="text-muted" v-if="project.locations.length">
          • {{ project.locations.map(({ name }) => name).join(', ') }}
        </span>
      </RouterLink>
    </template>
  </div>
  <ModalDialog ref="modalRef">
    <CreateProject @close="modalRef?.hide" />
  </ModalDialog>
</template>

<style>
.p-project-list-head {
  display: flex;
}
.p-project-list-head input[type='search'] {
  width: 20rem;
  max-width: 100%;
}
.p-project-list-head .btn {
  margin-left: auto;
}
.p-project-list {
  --color-border: var(--color-list-border);
  margin-top: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
}
.p-project-list-item {
  display: block;
  padding: 16px;
  color: inherit;
  text-decoration: none;
  transition: background-color 0.5s;
}
@media (hover: hover) {
  .p-project-list-item:hover {
    transition: background-color 0s;
    background-color: var(--color-background-accent);
  }
}
.p-project-list-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}
.p-project-list-item strong {
  font-weight: 600;
}
</style>
