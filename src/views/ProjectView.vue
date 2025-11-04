<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import EmployeeList from '@/components/EmployeeList.vue'
import ProjectDashboard from '@/components/ProjectDashboard.vue'

const { id } = defineProps<{
  id: string
}>()

const projectsStore = useProjectsStore()
try {
  await projectsStore.loadProject(id)
} catch (error) {
  console.error(error)
  const index = projectsStore.projects.findIndex((project) => project.id == parseInt(id))
  if (index !== -1) {
    projectsStore.projects.splice(index, 1)
  }
}
const project = computed(() => projectsStore.projects.find((project) => project.id == parseInt(id)))
</script>

<template>
  <div v-if="project">
    <h1 class="p-project-heading">
      {{ project.title }}
      <span class="text-muted text-uppercase">({{ project.language ?? 'de' }})</span>
    </h1>
    <div class="p-project-summary">
      <h3>
        <em>{{ $t('Clients') }}<span>:</span></em>
        <strong>{{ project.clients.map(({ company_name }) => company_name).join(', ') }}</strong>
      </h3>
      <h3>
        <em>{{ $t('Employees') }}<span>:</span></em> <strong>{{ project.employees.length }}</strong>
      </h3>
      <h3>
        <em>{{ $t('Clearing Point') }}<span>:</span></em>
        <strong>
          <template v-if="project.clearing_point == 'auto'">{{
            project.clearing_point_email
          }}</template>
          <template v-else-if="project.clearing_point">{{ project.clearing_point }}</template>
          <template v-else>-</template>
        </strong>
      </h3>
      <h3>
        <em>{{ $t('Employee self Service') }}<span>:</span></em>
        <strong>{{ project.employee_self_service || '-' }}</strong>
      </h3>
      <h3>
        <em>{{ $t('Level of Kliemt support') }}<span>:</span></em>
        <strong>{{ project.kliemt_support_level || '-' }}</strong>
      </h3>
    </div>
    <ProjectDashboard :project="project" />
    <EmployeeList :projectId="project.id" />
  </div>
  <div v-else>{{ $t('Project not found') }}</div>
</template>

<style>
.p-project-heading {
  font-size: 1.5rem;
  margin: 0.5rem 0 0.25rem;
  font-weight: 500;
  color: var(--color-kliemt);
}
.p-project-summary {
  display: flex;
  margin: 1rem -0.5rem;
}
.p-project-summary > * {
  flex: 1 0 0%;
  margin: 0 0.5rem;
  --color-border: var(--color-list-border);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}
.p-project-summary h3 {
  text-align: center;
  padding: 0.5rem;
}
.p-project-summary h3 em {
  display: block;
  padding-bottom: 0.5rem;
  font-size: 1rem;
  font-style: normal;
  font-weight: 300;
  color: var(--color-text-muted);
}
.p-project-summary h3 strong {
  display: block;
  font-weight: 500;
}
.p-project-summary h3 span {
  display: none;
}
</style>
