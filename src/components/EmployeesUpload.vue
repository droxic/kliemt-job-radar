<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { Employee } from '@/stores/employee.dto'
import DropFile from '@/components/DropFile.vue'
import {
  validateEmployees,
  type EmployeeValidationResult,
} from '@/utils/validateEmployees'

const { projectId } = defineProps<{
  projectId: number
}>()
const emit = defineEmits(['close'])
const newEmployees = ref<Employee[]>([])
const projectsStore = useProjectsStore()

const validationResult = ref<EmployeeValidationResult>({ isValid: true, errors: [] })

watch(newEmployees, (employees) => {
  if (employees.length) {
    validationResult.value = validateEmployees(employees)
  } else {
    validationResult.value = { isValid: true, errors: [] }
  }
}, { deep: true })

const existingEmployees = computed(
  () => projectsStore.projects.find((project) => project.id == projectId)?.employees || [],
)
const duplicatesCount = computed(
  () =>
    existingEmployees.value.filter(({ email }) => newEmployees.value.some((e) => e.email == email))
      .length,
)
const canUpload = computed(() => newEmployees.value.length > 0 && validationResult.value.isValid)

function upload() {
  if (!canUpload.value) return
  projectsStore.addEmployees(projectId, newEmployees.value)
  emit('close')
}
</script>

<template>
  <div class="modal-head">
    <h1>{{ $t('Add Employees') }}</h1>
    <button class="btn --secondary" @click="$emit('close')">{{ $t('Cancel') }}</button>
    <button class="btn --primary" :disabled="!canUpload" @click="upload">{{ $t('Add') }}</button>
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
      <div v-if="!validationResult.isValid" class="validation-errors">
        <p class="validation-errors-heading">{{ $t('validation-heading') }}</p>
        <ul class="validation-errors-list">
          <li v-for="error in validationResult.errors" :key="error.row">
            <strong>{{ $t('Row') || 'Row' }} {{ error.row }} ({{ error.name }}):</strong>
            {{ error.missingFields.map((f) => $t(f)).join(', ') }}
          </li>
        </ul>
      </div>
      <DropFile v-model="newEmployees" class="form-control" />
    </div>
  </div>
</template>
