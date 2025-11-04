<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { Employee } from '@/stores/employee.dto'
import DropFile from '@/components/DropFile.vue'

const { projectId } = defineProps<{
  projectId: number
}>()
const emit = defineEmits(['close'])
const newEmployees = ref<Employee[]>([])
const projectsStore = useProjectsStore()

const existingEmployees = computed(
  () => projectsStore.projects.find((project) => project.id == projectId)?.employees || [],
)
const duplicatesCount = computed(
  () =>
    existingEmployees.value.filter(({ email }) => newEmployees.value.some((e) => e.email == email))
      .length,
)
function upload() {
  projectsStore.addEmployees(projectId, newEmployees.value)
  emit('close')
}
</script>

<template>
  <div class="modal-head">
    <h1>{{ $t('Add Employees') }}</h1>
    <button class="btn --secondary" @click="$emit('close')">{{ $t('Cancel') }}</button>
    <button class="btn --primary" @click="upload">{{ $t('Add') }}</button>
  </div>
  <div class="modal-form">
    <div class="form-group file-upload">
      {{ $t('Employee data') }}:
      <div v-if="newEmployees.length">
        <i18n-t keypath="employees-selected" tag="p">
          <template #count>
            <strong>{{ newEmployees.length }}</strong>
          </template>
        </i18n-t>
        <template v-if="duplicatesCount">
          <i18n-t keypath="employees-duplicates" tag="p">
            <template #count>
              <strong>{{ duplicatesCount }}</strong>
            </template>
          </i18n-t>
        </template>
        <div v-for="(e, i) in newEmployees" :key="i">
          {{ e.first_name }} {{ e.remaining_salary_ratio }}
        </div>
      </div>
      <DropFile v-model="newEmployees" class="form-control" />
    </div>
  </div>
</template>
